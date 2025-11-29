import styles from './Footer.module.css';

export const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div>
           <img src="/verto.svg" alt="Verto Logo" className={styles.logo} />
          <p className={styles.tagline}>Release intelligence for product and platform teams.</p>
        </div>
        <p className={styles.copy}>&copy; {new Date().getFullYear()} Verto Labs. All rights reserved.</p>
      </div>
    </footer>
  );
};
