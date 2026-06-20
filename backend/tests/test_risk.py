import numpy as np
import pytest
from app.services.risk import _max_drawdown, _daily_returns, TRADING_DAYS


def test_max_drawdown_flat():
    prices = np.array([100.0] * 10)
    assert _max_drawdown(prices) == pytest.approx(0.0, abs=1e-6)


def test_max_drawdown_monotone_decline():
    prices = np.array([100.0, 90.0, 80.0, 70.0])
    dd = _max_drawdown(prices)
    assert dd < 0


def test_max_drawdown_recovery():
    prices = np.array([100.0, 80.0, 100.0])
    dd = _max_drawdown(prices)
    assert dd == pytest.approx(-0.2, abs=1e-4)


def test_daily_returns_shape():
    import pandas as pd
    closes = pd.Series([100.0, 102.0, 101.0, 105.0])
    df = pd.DataFrame({"Close": closes})
    ret = _daily_returns(df)
    assert len(ret) == 3


def test_daily_returns_values():
    import pandas as pd
    closes = pd.Series([100.0, 110.0])
    df = pd.DataFrame({"Close": closes})
    ret = _daily_returns(df)
    assert ret[0] == pytest.approx(0.1, abs=1e-6)


def test_portfolio_risk_summary_unit():
    """Smoke test: portfolio_risk_summary runs and returns expected keys."""
    from unittest.mock import patch
    import pandas as pd
    import numpy as np

    fake_df = pd.DataFrame({"Close": np.random.uniform(100, 200, 253)})

    with patch("app.services.risk.get_ohlcv_dataframe", return_value=fake_df):
        from app.services.risk import portfolio_risk_summary
        result = portfolio_risk_summary(["AAPL", "MSFT"], [0.5, 0.5])

    assert "sharpe_ratio" in result
    assert "annualized_return" in result
    assert "var_95" in result
