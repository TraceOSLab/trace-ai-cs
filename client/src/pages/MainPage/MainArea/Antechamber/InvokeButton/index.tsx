import { Button } from '@arco-design/web-react';
import Loading from './loading';
import styles from './index.module.less';

interface IInvokeButtonProps {
  onClick?: () => void;
  loading?: boolean;
  className?: string;
}

function InvokeButton(props: IInvokeButtonProps) {
  const { onClick, loading, className } = props;

  return (
    <Button
      type="primary"
      size="large"
      shape="round"
      onClick={onClick}
      className={`${styles.button} ${className || ''}`}
      loading={loading}
      loadingFixedWidth={false}
    >
      {loading ? <Loading /> : null}
      {loading ? '加载中...' : '开始对话'}
    </Button>
  );
}

export default InvokeButton;
