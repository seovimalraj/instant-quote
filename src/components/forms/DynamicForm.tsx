"use client";

interface Props {
  schema: any;
  action: (formData: FormData) => void;
}

export default function DynamicForm({ schema, action }: Props) {
  const properties = schema?.properties || {};
  const required: string[] = schema?.required || [];

  return (
    <form action={action} className="space-y-4">
      {Object.entries(properties).map(([key, config]: any) => {
        const isRequired = required.includes(key);
        let field = null;
        if (config.enum) {
          field = (
            <select
              name={key}
              required={isRequired}
              className="border p-2 rounded w-full"
              defaultValue=""
            >
              <option value="" disabled>
                Select...
              </option>
              {config.enum.map((opt: string) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          );
        } else if (config.type === "boolean") {
          field = (
            <input type="checkbox" name={key} className="mr-2" />
          );
        } else if (config.type === "number" || config.type === "integer") {
          field = (
            <input
              type="number"
              name={key}
              required={isRequired}
              className="border p-2 rounded w-full"
            />
          );
        } else {
          field = (
            <input
              type="text"
              name={key}
              required={isRequired}
              className="border p-2 rounded w-full"
            />
          );
        }
        return (
          <div key={key}>
            <label className="block text-sm font-medium mb-1">
              {config.title || key}
            </label>
            {field}
          </div>
        );
      })}
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
        Submit
      </button>
    </form>
  );
}

