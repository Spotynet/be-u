interface WelcomeSectionProps {
  title: string;
  description: string;
}

export const WelcomeSection = ({title, description}: WelcomeSectionProps) => {
  return (
    <div className="bg-gradient-to-br from-primary via-primary-dark to-accent p-12 flex flex-col justify-center items-center text-center">
      <h2 className="text-2xl font-bold text-primary-foreground mb-6 tracking-wider">{title}</h2>
      <p className="text-primary-foreground/90 text-lg leading-relaxed max-w-sm">{description}</p>
    </div>
  );
};

