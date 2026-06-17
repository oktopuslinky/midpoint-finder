import { Icon } from './Icon';

interface ConvergenceLineProps {
  /** Both endpoints resolved — lights the rail and midpoint star. */
  active?: boolean;
  /** Smaller variant for headers and inline use. */
  compact?: boolean;
  className?: string;
}

/**
 * The product's signature mark: Person A (coral) and Person B (teal) joined by
 * a rail that meets at a brass midpoint star. It encodes the app's single job —
 * the fair point in the middle — and recurs in the wordmark, hero, and section
 * dividers rather than being mere decoration.
 */
export function ConvergenceLine({
  active = false,
  compact = false,
  className,
}: ConvergenceLineProps) {
  return (
    <span
      className={`converge${compact ? ' converge--compact' : ''}${
        active ? ' converge--active' : ''
      }${className ? ` ${className}` : ''}`}
      aria-hidden="true"
    >
      <span className="converge-node converge-node--a">A</span>
      <span className="converge-rail">
        <span className="converge-rail-fill" />
        <span className="converge-star">
          <Icon name="star" filled size={compact ? 11 : 15} />
        </span>
      </span>
      <span className="converge-node converge-node--b">B</span>
    </span>
  );
}
