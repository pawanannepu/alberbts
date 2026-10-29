"use client";

import type { ComponentProps } from "react";

// A submit button that asks first. Use inside a <form action={serverAction}>.
export function ConfirmButton({ message, ...props }: { message: string } & ComponentProps<"button">) {
  return (
    <button
      type="submit"
      {...props}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    />
  );
}
