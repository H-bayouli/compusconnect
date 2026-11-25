interface StudentIllustrationProps {
  className?: string;
}

export default function StudentIllustration({
  className = "",
}: StudentIllustrationProps) {
  return (
    <div className={`student ${className}`} aria-hidden="true">
      <div className="head" />
      <div className="hair" />
      <div className="glasses">
        <i />
        <i />
      </div>
      <div className="body" />
      <div className="arm arm-a" />
      <div className="arm arm-b" />
      <div className="leg leg-a" />
      <div className="leg leg-b" />
      <div className="notebook" />
      <div className="backpack">
        <span className="backpack-paper" />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
