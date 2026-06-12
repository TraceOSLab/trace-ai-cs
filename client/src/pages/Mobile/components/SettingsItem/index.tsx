import { Switch } from '@arco-design/web-react';
import styles from './index.module.less';

interface ISettingsItemProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function SettingsItem({ label, checked, onChange }: ISettingsItemProps) {
  return (
    <div className={styles.item}>
      <span>{label}</span>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

export default SettingsItem;
