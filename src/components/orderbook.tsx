"use client";
import { Centrifuge } from "centrifuge";
import { useState, useEffect } from "react";

const LIMIT = 10; // How many rows of orders to show

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

const renderOrders = (orders: Order[], orderType: "ask" | "bid") =>
  orders
    .filter((o) => Number(o[1]) > 0)
    .toSorted((a, b) =>
      orderType === "bid"
        ? Number(b[0]) - Number(a[0])
        : Number(a[0]) - Number(b[0]),
    )
    .slice(0, LIMIT)
    .map((b) => (
      <tr key={b[0]}>
        <td className={orderType === "ask" ? "text-green-500" : "text-red-500"}>
          {parseInt(b[0]).toLocaleString()}
        </td>
        <td className="text-right text-gray-400">{b[1]}</td>
        <td></td>
      </tr>
    ));

export default function Orderbook({
  token,
  symbol,
}: {
  token: string;
  symbol: string;
}) {
  const [state, setState] = useState<Orderbook>();

  // Used to detect if need to re-establish websocket
  // Updating this will reset the websocket
  // Used in event that sequence number has misaligned
  const [nonce, setNonce] = useState<number>(0);

  useEffect(() => {
    const centrifuge = new Centrifuge("wss://api.prod.rabbitx.io/ws", {
      token,
    });

    centrifuge.connect();
    const sub = centrifuge.newSubscription(`orderbook:${symbol}`);
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
  }, [token, symbol, nonce]);

  if (!state) return "Loading";

  const tableHeaders = (
    <tr>
      <th className="text-left">
        Price{" "}
        <span className="bg-gray-100 rounded text-xs p-0.5">
          {state.market.split("-")[0]}
        </span>
      </th>
      <th className="text-right">
        Amount{" "}
        <span className="bg-gray-100 rounded text-xs p-0.5">
          {state.market.split("-")[1]}
        </span>
      </th>
      <th>Total</th>
    </tr>
  );
  return (
    <>
      Last updated: {new Date(state.timestamp / 1_000).toLocaleString()}
      <table className="border-2 w-96">
        <caption> Bids </caption>
        <thead>{tableHeaders}</thead>
        <tbody key={state.timestamp}>{renderOrders(state.bids, "bid")}</tbody>
      </table>
      <table className="border-2 w-96">
        <caption> Asks </caption>
        <thead>{tableHeaders}</thead>
        <tbody key={state.timestamp}>{renderOrders(state.asks, "ask")}</tbody>
      </table>
    </>
  );
}
