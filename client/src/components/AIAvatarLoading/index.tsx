import styles from './index.module.less';

function AIAvatarReadying() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.loadingContainer}>
        <div className={styles.ring} />
        <div className={styles.ring} />
        <div className={styles.ring} />
      </div>
      <div className={styles.text}>AI 准备中, 请稍侯</div>
    </div>
  );
}

export default AIAvatarReadying;
