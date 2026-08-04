interface HeroBaseProps {
  children: JSX.Element | JSX.Element[];
}

const HeroBase = ({ children }: HeroBaseProps) => (
  <section
    id="hero-base"
    className="h-auto sm:h-547 lg:h-789 flex flex-col sm:flex-row sm:items-center relative bg-gray-10"
  >
    {children}
  </section>
);

export default HeroBase;
