"use client";
import { Centrifuge } from "centrifuge";
import { useState, useEffect } from "react";

export default function Orderbook({ token }: { token: string }) {
  const [state, setState] = useState([]);

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
      setState(ctx.data);
    });

    sub.subscribe();

    return () => centrifuge.disconnect();
  }, [token]);

  if (!token) return "Loading";

  return <div> {JSON.stringify(state)} </div>;
}
