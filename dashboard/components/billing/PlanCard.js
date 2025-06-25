import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export function PlanCard({
  plan,
  isPopular = false,
  currentPlan = false,
  onSelect,
  loading = false,
}) {
  const { name, tagline, price, original_price, features, badge } = plan;

  return (
    <Card
      variant={isPopular ? "romantic" : "elevated"}
      className={`relative ${isPopular ? "ring-2 ring-pink-500" : ""}`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Mais Popular
          </span>
        </div>
      )}

      {badge && (
        <div className="absolute top-4 right-4">
          <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded text-xs font-bold">
            {badge}
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{name}</h3>
        <p className="text-gray-600 text-sm mb-4">{tagline}</p>

        <div className="flex items-baseline justify-center">
          <span className="text-3xl font-bold text-gray-900">R$ {price}</span>
          {original_price && (
            <span className="ml-2 text-lg text-gray-500 line-through">
              R$ {original_price}
            </span>
          )}
        </div>
      </div>

      <ul className="space-y-3 mb-6">
        {features?.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg
              className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-gray-700 text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => onSelect(plan)}
        variant={currentPlan ? "secondary" : "primary"}
        loading={loading}
        disabled={currentPlan}
        className="w-full"
      >
        {currentPlan ? "Plano Atual" : "Escolher Plano"}
      </Button>
    </Card>
  );
}
