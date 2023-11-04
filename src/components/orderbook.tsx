"use client";
import { Centrifuge } from "centrifuge";
import { useState, useEffect } from "react";

const LIMIT = 10;

type Order = [string, size]; // [price, size]

type Orderbook = {
  market: string;
  bids: Order[];
  asks: Order[];
  sequence: number;
  timestamp: number;
};

export default function Orderbook({ token }: { token: string }) {
  const [state, setState] = useState<Orderbook>();

  useEffect(() => {
    const centrifuge = new Centrifuge("wss://api.prod.rabbitx.io/ws", {
      token,
    });

    centrifuge.connect();
    const sub = centrifuge.newSubscription("orderbook:BTC-USD");

    sub.on("publication", (ctx) => {
      //setState(s => [...s, ctx.data]);
    });

    sub.on("subscribed", (ctx) => {
      setState({ ...ctx.data, market: ctx.data.market_id });
    });

    sub.subscribe();

    return () => centrifuge.disconnect();
  }, [token]);

  if (!token || !state) return "Loading";

  return (
    <>
      <h1> {state.market} </h1>
      Last updated: {new Date(state.timestamp / 1_000).toLocaleString()}
      <table className="border-2">
        <caption> Bids </caption>
        <thead>
          <tr className="border [&>*]:border">
            <th>Price</th>
            <th>Amount</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {state.bids
            .toSorted((a, b) => b[0] - a[0])
            .slice(0, LIMIT)
            .map((b) => (
              <tr key={b[0]} className="border [&>*]:border">
                <td>{b[0]}</td>
                <td>{b[1]}</td>
                <td></td>
              </tr>
            ))}
        </tbody>
      </table>
      <table className="border-2">
        <caption> Asks </caption>
        <thead>
          <tr className="border">
            <th>Price</th>
            <th>Amount</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {state.asks
            .toSorted((a, b) => b[0] - a[0])
            .slice(0, LIMIT)
            .map((b) => (
              <tr key={b[0]} className="border [&>*]:border">
                <td>{b[0]}</td>
                <td>{b[1]}</td>
                <td></td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  );
}
