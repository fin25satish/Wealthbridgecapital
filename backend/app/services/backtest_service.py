import pandas as pd
import numpy as np
import yfinance as yf
from typing import Dict, Any, List
from .stock_service import get_yf_symbol


def run_backtest(
    symbol: str,
    exchange: str,
    strategy: str,
    start_date: str,
    end_date: str,
    initial_capital: float = 100000.0,
    params: dict = None,
) -> Dict[str, Any]:
    yf_sym = get_yf_symbol(symbol, exchange)
    df = yf.download(yf_sym, start=start_date, end=end_date, progress=False, auto_adjust=True)
    if df.empty:
        return {"error": "No data found for the given symbol and date range."}

    df = df[["Open", "High", "Low", "Close", "Volume"]].copy()
    df.dropna(inplace=True)

    if strategy == "sma_crossover":
        return _sma_crossover(df, initial_capital, params or {})
    elif strategy == "rsi":
        return _rsi_strategy(df, initial_capital, params or {})
    elif strategy == "bollinger":
        return _bollinger_strategy(df, initial_capital, params or {})
    elif strategy == "momentum":
        return _momentum_strategy(df, initial_capital, params or {})
    else:
        return {"error": f"Unknown strategy: {strategy}"}


def _compute_metrics(portfolio_values: pd.Series, initial_capital: float, trades: List) -> Dict:
    returns = portfolio_values.pct_change().dropna()
    total_return = (portfolio_values.iloc[-1] / initial_capital - 1) * 100
    n_years = len(portfolio_values) / 252
    cagr = ((portfolio_values.iloc[-1] / initial_capital) ** (1 / max(n_years, 0.01)) - 1) * 100

    rolling_max = portfolio_values.cummax()
    drawdown = (portfolio_values - rolling_max) / rolling_max * 100
    max_drawdown = float(drawdown.min())

    sharpe = (returns.mean() / returns.std() * np.sqrt(252)) if returns.std() > 0 else 0

    winning = [t for t in trades if t.get("pnl", 0) > 0]
    win_rate = len(winning) / len(trades) * 100 if trades else 0

    equity_curve = [
        {"date": str(d.date()), "value": round(float(v), 2)}
        for d, v in portfolio_values.items()
    ]

    return {
        "initial_capital": initial_capital,
        "final_value": round(float(portfolio_values.iloc[-1]), 2),
        "total_return_pct": round(total_return, 2),
        "cagr_pct": round(cagr, 2),
        "sharpe_ratio": round(float(sharpe), 3),
        "max_drawdown_pct": round(max_drawdown, 2),
        "total_trades": len(trades),
        "win_rate_pct": round(win_rate, 2),
        "winning_trades": len(winning),
        "losing_trades": len(trades) - len(winning),
        "equity_curve": equity_curve[::max(1, len(equity_curve) // 300)],
        "trades": trades[-50:],
    }


def _sma_crossover(df: pd.DataFrame, initial_capital: float, params: dict) -> Dict:
    fast = int(params.get("fast_period", 20))
    slow = int(params.get("slow_period", 50))

    df["sma_fast"] = df["Close"].rolling(fast).mean()
    df["sma_slow"] = df["Close"].rolling(slow).mean()
    df.dropna(inplace=True)

    cash = initial_capital
    position = 0
    portfolio_values = []
    trades = []

    for i in range(1, len(df)):
        price = float(df["Close"].iloc[i])
        fast_prev = float(df["sma_fast"].iloc[i - 1])
        slow_prev = float(df["sma_slow"].iloc[i - 1])
        fast_curr = float(df["sma_fast"].iloc[i])
        slow_curr = float(df["sma_slow"].iloc[i])

        if fast_prev <= slow_prev and fast_curr > slow_curr and position == 0:
            position = cash / price
            entry_price = price
            cash = 0
            trades.append({"date": str(df.index[i].date()), "action": "BUY", "price": round(price, 2)})
        elif fast_prev >= slow_prev and fast_curr < slow_curr and position > 0:
            cash = position * price
            pnl = (price - entry_price) * position
            position = 0
            trades.append({"date": str(df.index[i].date()), "action": "SELL", "price": round(price, 2), "pnl": round(pnl, 2)})

        portfolio_values.append(cash + position * price)

    portfolio_series = pd.Series(portfolio_values, index=df.index[1:])
    result = _compute_metrics(portfolio_series, initial_capital, [t for t in trades if t.get("action") == "SELL"])
    result["strategy"] = "SMA Crossover"
    result["params"] = {"fast_period": fast, "slow_period": slow}
    return result


def _rsi_strategy(df: pd.DataFrame, initial_capital: float, params: dict) -> Dict:
    period = int(params.get("rsi_period", 14))
    oversold = float(params.get("oversold", 30))
    overbought = float(params.get("overbought", 70))

    delta = df["Close"].diff()
    gain = delta.where(delta > 0, 0).rolling(period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(period).mean()
    rs = gain / loss
    df["rsi"] = 100 - (100 / (1 + rs))
    df.dropna(inplace=True)

    cash = initial_capital
    position = 0
    entry_price = 0
    portfolio_values = []
    trades = []

    for i in range(1, len(df)):
        price = float(df["Close"].iloc[i])
        rsi_prev = float(df["rsi"].iloc[i - 1])
        rsi_curr = float(df["rsi"].iloc[i])

        if rsi_prev <= oversold and rsi_curr > oversold and position == 0:
            position = cash / price
            entry_price = price
            cash = 0
            trades.append({"date": str(df.index[i].date()), "action": "BUY", "price": round(price, 2)})
        elif rsi_prev >= overbought and rsi_curr < overbought and position > 0:
            cash = position * price
            pnl = (price - entry_price) * position
            position = 0
            trades.append({"date": str(df.index[i].date()), "action": "SELL", "price": round(price, 2), "pnl": round(pnl, 2)})

        portfolio_values.append(cash + position * price)

    portfolio_series = pd.Series(portfolio_values, index=df.index[1:])
    result = _compute_metrics(portfolio_series, initial_capital, [t for t in trades if t.get("action") == "SELL"])
    result["strategy"] = "RSI Mean Reversion"
    result["params"] = {"rsi_period": period, "oversold": oversold, "overbought": overbought}
    return result


def _bollinger_strategy(df: pd.DataFrame, initial_capital: float, params: dict) -> Dict:
    period = int(params.get("period", 20))
    std_dev = float(params.get("std_dev", 2.0))

    df["bb_mid"] = df["Close"].rolling(period).mean()
    df["bb_std"] = df["Close"].rolling(period).std()
    df["bb_upper"] = df["bb_mid"] + std_dev * df["bb_std"]
    df["bb_lower"] = df["bb_mid"] - std_dev * df["bb_std"]
    df.dropna(inplace=True)

    cash = initial_capital
    position = 0
    entry_price = 0
    portfolio_values = []
    trades = []

    for i in range(len(df)):
        price = float(df["Close"].iloc[i])
        lower = float(df["bb_lower"].iloc[i])
        upper = float(df["bb_upper"].iloc[i])
        mid = float(df["bb_mid"].iloc[i])

        if price <= lower and position == 0:
            position = cash / price
            entry_price = price
            cash = 0
            trades.append({"date": str(df.index[i].date()), "action": "BUY", "price": round(price, 2)})
        elif price >= mid and position > 0:
            cash = position * price
            pnl = (price - entry_price) * position
            position = 0
            trades.append({"date": str(df.index[i].date()), "action": "SELL", "price": round(price, 2), "pnl": round(pnl, 2)})

        portfolio_values.append(cash + position * price)

    portfolio_series = pd.Series(portfolio_values, index=df.index)
    result = _compute_metrics(portfolio_series, initial_capital, [t for t in trades if t.get("action") == "SELL"])
    result["strategy"] = "Bollinger Band Breakout"
    result["params"] = {"period": period, "std_dev": std_dev}
    return result


def _momentum_strategy(df: pd.DataFrame, initial_capital: float, params: dict) -> Dict:
    lookback = int(params.get("lookback", 20))
    hold_days = int(params.get("hold_days", 10))

    df["momentum"] = df["Close"].pct_change(lookback)
    df.dropna(inplace=True)

    cash = initial_capital
    position = 0
    entry_price = 0
    days_held = 0
    portfolio_values = []
    trades = []

    for i in range(len(df)):
        price = float(df["Close"].iloc[i])
        mom = float(df["momentum"].iloc[i])

        if mom > 0 and position == 0:
            position = cash / price
            entry_price = price
            cash = 0
            days_held = 0
            trades.append({"date": str(df.index[i].date()), "action": "BUY", "price": round(price, 2)})
        elif position > 0:
            days_held += 1
            if days_held >= hold_days or mom < 0:
                cash = position * price
                pnl = (price - entry_price) * position
                position = 0
                trades.append({"date": str(df.index[i].date()), "action": "SELL", "price": round(price, 2), "pnl": round(pnl, 2)})

        portfolio_values.append(cash + position * price)

    portfolio_series = pd.Series(portfolio_values, index=df.index)
    result = _compute_metrics(portfolio_series, initial_capital, [t for t in trades if t.get("action") == "SELL"])
    result["strategy"] = "Momentum"
    result["params"] = {"lookback": lookback, "hold_days": hold_days}
    return result
