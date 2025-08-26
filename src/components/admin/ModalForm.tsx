"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ZodSchema } from "zod";
import { Field } from "@/types/forms";
export type { Field };

interface ModalFormProps {
  open: boolean;
  onClose: () => void;
  schema: ZodSchema<any>;
  fields: Field[];
  initialValues: any;
  onSubmit: (values: any) => Promise<void>;
  error?: string | null;
}

export default function ModalForm({
  open,
  onClose,
  schema,
  fields,
  initialValues,
  onSubmit,
  error,
}: ModalFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<any>({ defaultValues: initialValues });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const submit = handleSubmit(async (values) => {
    const result = schema.safeParse(values);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        setError(path as any, { message: issue.message });
      });
      return;
    }
    await onSubmit(result.data);
    reset({});
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <form
        onSubmit={submit}
        className="bg-white rounded-md p-6 w-full max-w-md space-y-4"
      >
        {fields.map((field, idx) => (
          <div key={field.name}>
            {field.type !== "hidden" && (
              <label className="block text-sm font-medium mb-1">
                {field.label}
              </label>
            )}
            {field.type === "select" && field.options ? (
              <select
                defaultValue={field.defaultValue}
                {...register(
                  field.name,
                  field.required ? { required: true } : undefined
                )}
                className="border rounded p-2 w-full"
              >
                <option value="">
                  {field.placeholder ? field.placeholder : "Select..."}
                </option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : field.type === "checkbox" ? (
              <input
                type="checkbox"
                defaultChecked={field.defaultValue}
                {...register(
                  field.name,
                  field.required ? { required: true } : undefined
                )}
              />
            ) : (
              <input
                type={field.type}
                defaultValue={field.defaultValue}
                placeholder={field.placeholder}
                {...register(field.name, {
                  valueAsNumber: field.type === "number" ? true : undefined,
                  required: field.required,
                })}
                className={
                  field.type === "hidden" ? undefined : "border rounded p-2 w-full"
                }
                autoFocus={idx === 0}
              />
            )}
            {field.help && field.type !== "hidden" && (
              <p className="text-gray-500 text-xs mt-1">{field.help}</p>
            )}
            {field.type !== "hidden" && errors[field.name] && (
              <p className="text-red-600 text-sm mt-1">
                {(errors as any)[field.name]?.message as string}
              </p>
            )}
          </div>
        ))}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

