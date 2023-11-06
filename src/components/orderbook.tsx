"use client";
import { Centrifuge } from "centrifuge";
import { useState, useEffect } from "react";

const LIMIT = 10;

type Order = [string, string]; // [price, size]

type Orderbook = {
  market: string;
  bids: Order[];
  asks: Order[];
  sequence: number;
  timestamp: number;
};

const merge = (orders: Order[], order: Order) => {
  const index = orders.findIndex((o) => o?.[0] == order?.[0]);

  return index !== undefined ? orders.with(index, order) : [...orders, order];
};

const renderOrders = (orders: Order[]) =>
  orders
    .filter((o) => Number(o[1]) > 0)
    .toSorted((a, b) => Number(b[0]) - Number(a[0]))
    .slice(0, LIMIT)
    .map((b) => (
      <tr key={b[0]} className="border [&>*]:border">
        <td>{parseInt(b[0])}</td>
        <td>{b[1]}</td>
        <td></td>
      </tr>
    ));

export default function Orderbook({ token }: { token: string }) {
  const [state, setState] = useState<Orderbook>();
  const [nonce, setNonce] = useState<number>(0); // used to detect if need to re-establish websocket

  useEffect(() => {
    const centrifuge = new Centrifuge("wss://api.prod.rabbitx.io/ws", {
      token,
    });

    centrifuge.connect();
    const sub = centrifuge.newSubscription("orderbook:BTC-USD");
    sub.on("publication", (ctx) => {
      setState((s) => {
        if (s === undefined) return s;
        if (ctx.data.sequence != s.sequence + 1) setNonce((n) => n + 1);
        const ask = ctx.data.asks?.[0];
        const bid = ctx.data.bids?.[0];

        const newAsks = ask !== undefined ? merge(s.asks, ask) : s.asks;
        const newBids = bid !== undefined ? merge(s.bids, bid) : s.bids;

        return {
          ...s,
          asks: newAsks,
          bids: newBids,
          timestamp: ctx.data.timestamp,
          sequence: ctx.data.sequence,
        };
      });
    });

    sub.on("subscribed", (ctx) => {
      setState({ ...ctx.data, market: ctx.data.market_id });
    });

    sub.subscribe();

    return () => centrifuge.disconnect();
  }, [token, nonce]);

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
        <tbody key={state.timestamp}>{renderOrders(state.bids)}</tbody>
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
        <tbody key={state.timestamp}>{renderOrders(state.asks)}</tbody>
      </table>
    </>
  );
}
