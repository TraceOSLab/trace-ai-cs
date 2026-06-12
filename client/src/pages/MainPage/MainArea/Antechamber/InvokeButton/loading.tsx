import styles from './index.module.less';

function Loading() {
  return (
    <span className={styles.loadingWrapper}>
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
    </span>
  );
}

export default Loading;
