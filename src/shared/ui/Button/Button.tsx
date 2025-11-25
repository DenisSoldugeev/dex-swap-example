import type { ButtonProps as MantineButtonProps } from '@mantine/core';
import { Button as MantineButton } from '@mantine/core';
import type { FC } from 'react';
import styles from './Button.module.scss';

export type ButtonProps = MantineButtonProps;

const Button: FC<ButtonProps> = ({ className, ...props }) => {
  const composedClassName = className ? `${styles.root} ${className}` : styles.root;
  return <MantineButton className={composedClassName} {...props} />;
};

export default Button;
