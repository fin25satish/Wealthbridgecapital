import yfinance as yf
import pandas as pd
import requests
from bs4 import BeautifulSoup
import feedparser
from typing import Optional, List, Dict, Any
import json


INDIA_INDICES = {
    "^NSEI": "Nifty 50",
    "^BSESN": "Sensex",
    "^NSEBANK": "Bank Nifty",
    "^CNXMIDCAP": "Nifty Midcap",
}

US_INDICES = {
    "^GSPC": "S&P 500",
    "^DJI": "Dow Jones",
    "^IXIC": "NASDAQ",
    "^RUT": "Russell 2000",
}


def get_yf_symbol(symbol: str, exchange: str) -> str:
    symbol = symbol.upper().strip()
    if exchange in ("NSE", "BSE"):
        suffix = ".NS" if exchange == "NSE" else ".BO"
        if not symbol.endswith((".NS", ".BO")):
            return symbol + suffix
    return symbol


def get_stock_quote(symbol: str, exchange: str = "NSE") -> Dict[str, Any]:
    yf_sym = get_yf_symbol(symbol, exchange)
    ticker = yf.Ticker(yf_sym)
    info = ticker.fast_info
    hist = ticker.history(period="2d")

    price = float(info.last_price) if info.last_price else 0.0
    prev_close = float(hist["Close"].iloc[-2]) if len(hist) >= 2 else price
    change = price - prev_close
    change_pct = (change / prev_close * 100) if prev_close else 0.0

    return {
        "symbol": symbol,
        "exchange": exchange,
        "yf_symbol": yf_sym,
        "price": round(price, 2),
        "change": round(change, 2),
        "change_pct": round(change_pct, 2),
        "volume": int(info.three_month_average_volume or 0),
        "market_cap": info.market_cap,
        "currency": info.currency,
    }


def get_stock_history(symbol: str, exchange: str, period: str = "1y", interval: str = "1d") -> List[Dict]:
    yf_sym = get_yf_symbol(symbol, exchange)
    ticker = yf.Ticker(yf_sym)
    hist = ticker.history(period=period, interval=interval)
    hist.reset_index(inplace=True)
    records = []
    for _, row in hist.iterrows():
        records.append({
            "date": row["Date"].isoformat() if hasattr(row["Date"], "isoformat") else str(row["Date"]),
            "open": round(float(row["Open"]), 2),
            "high": round(float(row["High"]), 2),
            "low": round(float(row["Low"]), 2),
            "close": round(float(row["Close"]), 2),
            "volume": int(row["Volume"]),
        })
    return records


def get_stock_fundamentals(symbol: str, exchange: str = "NSE") -> Dict[str, Any]:
    yf_sym = get_yf_symbol(symbol, exchange)
    ticker = yf.Ticker(yf_sym)
    info = ticker.info

    def safe(key, default=None):
        val = info.get(key, default)
        if val == "Infinity" or val == float("inf"):
            return None
        return val

    return {
        "symbol": symbol,
        "name": safe("longName") or safe("shortName", symbol),
        "sector": safe("sector"),
        "industry": safe("industry"),
        "description": safe("longBusinessSummary", "")[:500] if safe("longBusinessSummary") else "",
        "market_cap": safe("marketCap"),
        "pe_ratio": safe("trailingPE"),
        "forward_pe": safe("forwardPE"),
        "pb_ratio": safe("priceToBook"),
        "ps_ratio": safe("priceToSalesTrailing12Months"),
        "eps": safe("trailingEps"),
        "forward_eps": safe("forwardEps"),
        "roe": safe("returnOnEquity"),
        "roa": safe("returnOnAssets"),
        "debt_to_equity": safe("debtToEquity"),
        "current_ratio": safe("currentRatio"),
        "revenue": safe("totalRevenue"),
        "gross_profit": safe("grossProfits"),
        "operating_cashflow": safe("operatingCashflow"),
        "free_cashflow": safe("freeCashflow"),
        "dividend_yield": safe("dividendYield"),
        "52w_high": safe("fiftyTwoWeekHigh"),
        "52w_low": safe("fiftyTwoWeekLow"),
        "avg_volume": safe("averageVolume"),
        "beta": safe("beta"),
        "analyst_recommendation": safe("recommendationKey"),
        "target_price": safe("targetMeanPrice"),
        "num_analysts": safe("numberOfAnalystOpinions"),
        "currency": safe("currency"),
        "exchange": safe("exchange"),
        "website": safe("website"),
        "employees": safe("fullTimeEmployees"),
    }


def get_analyst_recommendations(symbol: str, exchange: str = "NSE") -> Dict[str, Any]:
    yf_sym = get_yf_symbol(symbol, exchange)
    ticker = yf.Ticker(yf_sym)
    try:
        recs = ticker.recommendations
        if recs is not None and not recs.empty:
            recs.reset_index(inplace=True)
            recent = recs.tail(20)
            counts = {"strongBuy": 0, "buy": 0, "hold": 0, "sell": 0, "strongSell": 0}
            for _, row in recent.iterrows():
                for k in counts:
                    if k in row:
                        counts[k] += int(row.get(k, 0))
            return {"summary": counts, "recent": recent.tail(5).to_dict(orient="records")}
    except Exception:
        pass
    info = ticker.info
    return {
        "summary": {"recommendation": info.get("recommendationKey", "N/A")},
        "recent": [],
    }


def search_stocks(query: str, exchange: str = "ALL") -> List[Dict[str, Any]]:
    results = []
    try:
        search_results = yf.Search(query, max_results=10)
        quotes = search_results.quotes
        for q in quotes:
            ex = q.get("exchange", "")
            sym = q.get("symbol", "")
            if exchange == "INDIA" and not (sym.endswith(".NS") or sym.endswith(".BO")):
                continue
            if exchange == "USA" and (sym.endswith(".NS") or sym.endswith(".BO")):
                continue
            results.append({
                "symbol": sym,
                "name": q.get("longname") or q.get("shortname", sym),
                "exchange": ex,
                "type": q.get("quoteType", ""),
                "sector": q.get("sector", ""),
            })
    except Exception:
        pass
    return results


def get_market_overview() -> Dict[str, Any]:
    indices = {**INDIA_INDICES, **US_INDICES}
    data = {}
    for sym, name in indices.items():
        try:
            ticker = yf.Ticker(sym)
            hist = ticker.history(period="2d")
            if len(hist) >= 2:
                close = float(hist["Close"].iloc[-1])
                prev = float(hist["Close"].iloc[-2])
                chg = close - prev
                chg_pct = chg / prev * 100
                data[sym] = {
                    "name": name,
                    "price": round(close, 2),
                    "change": round(chg, 2),
                    "change_pct": round(chg_pct, 2),
                }
        except Exception:
            data[sym] = {"name": name, "price": 0, "change": 0, "change_pct": 0}
    return data


def get_news_feed(symbol: Optional[str] = None) -> List[Dict[str, Any]]:
    feeds = [
        "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
        "https://feeds.finance.yahoo.com/rss/2.0/headline?s=AAPL&region=US&lang=en-US",
        "https://www.moneycontrol.com/rss/marketsindia.xml",
    ]
    if symbol:
        feeds.append(f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={symbol}&region=US&lang=en-US")

    articles = []
    seen = set()
    for url in feeds:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:8]:
                title = entry.get("title", "")
                if title in seen:
                    continue
                seen.add(title)
                articles.append({
                    "title": title,
                    "link": entry.get("link", ""),
                    "published": entry.get("published", ""),
                    "summary": entry.get("summary", "")[:200],
                    "source": feed.feed.get("title", ""),
                })
        except Exception:
            pass
    return articles[:30]


def get_technical_indicators(symbol: str, exchange: str = "NSE") -> Dict[str, Any]:
    yf_sym = get_yf_symbol(symbol, exchange)
    ticker = yf.Ticker(yf_sym)
    hist = ticker.history(period="1y")
    if hist.empty:
        return {}

    close = hist["Close"]
    volume = hist["Volume"]

    sma20 = close.rolling(20).mean().iloc[-1]
    sma50 = close.rolling(50).mean().iloc[-1]
    sma200 = close.rolling(200).mean().iloc[-1]
    ema12 = close.ewm(span=12).mean().iloc[-1]
    ema26 = close.ewm(span=26).mean().iloc[-1]
    macd_line = ema12 - ema26
    signal = (close.ewm(span=12).mean() - close.ewm(span=26).mean()).ewm(span=9).mean().iloc[-1]

    delta = close.diff()
    gain = delta.where(delta > 0, 0).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs = gain / loss
    rsi = (100 - (100 / (1 + rs))).iloc[-1]

    bb_mid = close.rolling(20).mean()
    bb_std = close.rolling(20).std()
    bb_upper = (bb_mid + 2 * bb_std).iloc[-1]
    bb_lower = (bb_mid - 2 * bb_std).iloc[-1]
    bb_mid_val = bb_mid.iloc[-1]

    current_price = float(close.iloc[-1])

    def safe_float(v):
        try:
            return round(float(v), 2)
        except Exception:
            return None

    return {
        "sma20": safe_float(sma20),
        "sma50": safe_float(sma50),
        "sma200": safe_float(sma200),
        "ema12": safe_float(ema12),
        "ema26": safe_float(ema26),
        "macd": safe_float(macd_line),
        "macd_signal": safe_float(signal),
        "rsi": safe_float(rsi),
        "bb_upper": safe_float(bb_upper),
        "bb_mid": safe_float(bb_mid_val),
        "bb_lower": safe_float(bb_lower),
        "price": safe_float(current_price),
        "signal_summary": {
            "sma_trend": "bullish" if current_price > sma50 else "bearish",
            "rsi_status": "overbought" if rsi > 70 else ("oversold" if rsi < 30 else "neutral"),
            "macd_signal": "bullish" if macd_line > signal else "bearish",
        },
    }


def get_earnings_calendar(symbol: str, exchange: str = "NSE") -> List[Dict]:
    yf_sym = get_yf_symbol(symbol, exchange)
    ticker = yf.Ticker(yf_sym)
    try:
        earnings = ticker.earnings_dates
        if earnings is not None and not earnings.empty:
            earnings = earnings.reset_index()
            return earnings.head(8).to_dict(orient="records")
    except Exception:
        pass
    return []


def screen_stocks(
    exchange: str = "NSE",
    min_pe: Optional[float] = None,
    max_pe: Optional[float] = None,
    min_market_cap: Optional[float] = None,
    sector: Optional[str] = None,
) -> List[Dict]:
    nifty50 = [
        "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
        "HINDUNILVR.NS", "SBIN.NS", "BHARTIARTL.NS", "ITC.NS", "KOTAKBANK.NS",
        "LT.NS", "AXISBANK.NS", "WIPRO.NS", "ONGC.NS", "NTPC.NS",
        "BAJFINANCE.NS", "MARUTI.NS", "TITAN.NS", "SUNPHARMA.NS", "ULTRACEMCO.NS",
    ]
    sp500_sample = [
        "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA",
        "META", "TSLA", "BRK-B", "UNH", "JNJ",
        "JPM", "V", "PG", "MA", "HD",
        "CVX", "MRK", "ABBV", "PFE", "AVGO",
    ]

    symbols = nifty50 if exchange == "NSE" else sp500_sample
    results = []
    for sym in symbols:
        try:
            ticker = yf.Ticker(sym)
            info = ticker.fast_info
            full_info = ticker.info
            pe = full_info.get("trailingPE")
            mc = info.market_cap
            sec = full_info.get("sector", "")
            price = float(info.last_price or 0)

            if min_pe and pe and pe < min_pe:
                continue
            if max_pe and pe and pe > max_pe:
                continue
            if min_market_cap and mc and mc < min_market_cap:
                continue
            if sector and sector.lower() not in (sec or "").lower():
                continue

            results.append({
                "symbol": sym.replace(".NS", "").replace(".BO", ""),
                "name": full_info.get("longName") or full_info.get("shortName", sym),
                "sector": sec,
                "price": round(price, 2),
                "market_cap": mc,
                "pe_ratio": pe,
                "52w_high": full_info.get("fiftyTwoWeekHigh"),
                "52w_low": full_info.get("fiftyTwoWeekLow"),
                "change_pct": 0,
            })
        except Exception:
            pass
    return results
