import styles from './index.module.less';

function ResizeWrapper(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, children, ...rest } = props;
  return (
    <div className={`${styles.wrapper} ${className || ''}`} {...rest}>
      {children}
    </div>
  );
}

export default ResizeWrapper;
