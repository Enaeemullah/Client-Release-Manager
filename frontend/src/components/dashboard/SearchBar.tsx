import styles from './SearchBar.module.css';
import { SearchIcon } from '../common/icons';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar = ({ value, onChange, placeholder }: SearchBarProps) => (
  <div className={styles.wrapper}>
    <span className={styles.icon}>
      <SearchIcon />
    </span>
    <input
      className={styles.input}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  </div>
);
