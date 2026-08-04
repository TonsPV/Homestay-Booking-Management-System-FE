import { homeContent } from "../data/homeContent";

export function HomeTrustSection() {
  return (
    <section
      aria-label="Thông tin giúp bạn yên tâm đặt phòng"
      className="mx-auto w-full max-w-app px-4 pb-16 pt-48 sm:px-6 sm:pb-20 sm:pt-32 lg:px-8 lg:pt-28"
      id="home-trust"
    >
      <ul className="grid gap-7 border-y border-line py-7 md:grid-cols-3 md:gap-0 md:divide-x md:divide-line">
        {homeContent.trust.map((item) => {
          const Icon = item.icon;
          return (
            <li
              className="flex gap-4 md:px-7 first:md:pl-0 last:md:pr-0"
              key={item.title}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-control bg-brand-soft text-brand">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className="text-sm font-black text-ink">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {item.description}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
