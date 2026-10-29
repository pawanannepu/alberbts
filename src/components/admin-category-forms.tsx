"use client";

import { useActionState } from "react";

import { createCategory, deleteCategory, type CategoryState } from "@/app/admin/categories/actions";

export function CreateCategoryForm() {
  const [state, action, pending] = useActionState<CategoryState, FormData>(createCategory, {});
  return (
    <form action={action} className="flex max-w-md flex-col gap-2">
      <label htmlFor="category-name" className="label">
        New category
      </label>
      <div className="flex gap-2">
        <input id="category-name" name="name" required maxLength={60} className="field" />
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
      <p role="alert" className="caption min-h-[1.125rem] text-danger">
        {state.error}
      </p>
    </form>
  );
}

export function DeleteCategoryForm({ id, name }: { id: number; name: string }) {
  const [state, action, pending] = useActionState<CategoryState, FormData>(deleteCategory, {});
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`Delete the "${name}" category?`)) event.preventDefault();
      }}
      className="flex items-center justify-end gap-3"
    >
      <input type="hidden" name="id" value={id} />
      {state.error && (
        <span role="alert" className="caption text-danger">
          {state.error}
        </span>
      )}
      <button type="submit" disabled={pending} className="caption text-danger underline underline-offset-4">
        Delete
      </button>
    </form>
  );
}
