interface SectionHeadingProps {
  title: string
  description: string
}

export default function SectionHeading({ title, description }: SectionHeadingProps) {
  return (
    <div className="mx-auto mb-10 max-w-[760px] text-center md:mb-14">
      <h2
        className="text-3xl font-bold leading-[1.2] tracking-normal md:text-5xl"
        style={{ color: 'var(--text-primary)' }}
      >
        {title}
      </h2>
      <p
        className="mx-auto mt-4 max-w-[680px] text-sm leading-7 md:text-base"
        style={{ color: 'var(--text-secondary)' }}
      >
        {description}
      </p>
    </div>
  )
}
