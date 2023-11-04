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

const merge = (orders: Order[], order: Order) => {
  const index = orders.find((o) => o?.[0] == order?.[0]);

  return index !== undefined ? orders.with(index, order) : [...orders, order];
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
      setState((s) => {
        if (s === undefined) return s;
        const ask = ctx.data.asks?.[0];
        const bid = ctx.data.bids?.[0];

        const newAsks = ask !== undefined ? merge(s.asks, ask) : s.asks;
        const newBids = bid !== undefined ? merge(s.bids, bid) : s.bids;

        return {
          ...s,
          asks: newAsks,
          bids: newBids,
          timestamp: ctx.data.timestamp,
        };
      });
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
        <tbody key={state.timestamp}>
          {state.bids
            .filter((o) => o[1] > 0)
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
        <tbody key={state.timestamp}>
          {state.asks
            .filter((o) => o[1] > 0)
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
