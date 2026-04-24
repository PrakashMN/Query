const steps = ["Draft", "Active", "Negotiation", "Closed"];

function StatusBar({ current }) {
  const activeIndex = steps.indexOf(current);

  return (
    <div className="status-bar">
      {steps.map((step, index) => {
        const className =
          index < activeIndex ? "status-step done" : index === activeIndex ? "status-step active" : "status-step";
        return (
          <div key={step} className={className}>
            {step}
          </div>
        );
      })}
    </div>
  );
}

export default StatusBar;
