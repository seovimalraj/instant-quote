interface ListFeedItem {
  id: string | number;
  primary: string;
  secondary?: string;
}

interface ListFeedProps {
  title: string;
  items: ListFeedItem[];
}

export default function ListFeed({ title, items }: ListFeedProps) {
  return (
    <section>
      <h2 className="text-lg font-medium mb-2">{title}</h2>
      <ul className="space-y-1 text-sm">
        {items.length ? (
          items.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>{item.primary}</span>
              {item.secondary && (
                <span className="text-gray-500">{item.secondary}</span>
              )}
            </li>
          ))
        ) : (
          <li className="text-gray-500">No items</li>
        )}
      </ul>
    </section>
  );
}
