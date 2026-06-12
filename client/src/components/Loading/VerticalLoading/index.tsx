import styles from './index.module.less';

function VerticalLoading() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={styles.bar}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export default VerticalLoading;
