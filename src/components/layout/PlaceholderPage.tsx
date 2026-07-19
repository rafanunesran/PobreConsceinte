interface PlaceholderPageProps {
  title: string
}

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 pt-24 text-center">
      <p className="text-xl font-semibold text-light-primary dark:text-dark-primary">{title}</p>
      <p className="text-sm text-light-secondary dark:text-dark-secondary">
        Chega numa próxima fase.
      </p>
    </div>
  )
}
