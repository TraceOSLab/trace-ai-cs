import styles from './index.module.less';

interface IAudioLoadingProps {
  loading: boolean;
  color?: string;
}

function AudioLoading({ loading, color }: IAudioLoadingProps) {
  return (
    <div className={styles.wrapper}>
      {loading ? (
        <div className={styles.audioWave}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={styles.bar}
              style={{ backgroundColor: color || '#635bff', animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default AudioLoading;
