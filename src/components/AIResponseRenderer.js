import React from "react";
import TripCard from "./TripCard";
import BudgetCard from "./BudgetCard";

export default function AIResponseRenderer({ message }) {
  if (!message?.json) return null;

  const { type, data } = message.json;

  switch (type) {
    case "trip":
      return <TripCard data={data} />;
    case "budget":
      return <BudgetCard data={data} />;
    default:
      return null;
  }
}