import styles from './index.module.less';

interface IHorizonLoadingProps {
  gap?: number;
  className?: string;
  dotClassName?: string;
}

function HorizonLoading({ gap = 4, className, dotClassName }: IHorizonLoadingProps) {
  return (
    <span className={`${styles.wrapper} ${className || ''}`} style={{ gap }}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={`${styles.dot} ${dotClassName || ''}`}
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </span>
  );
}

export default HorizonLoading;
