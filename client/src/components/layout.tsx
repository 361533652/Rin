import React from 'react';
import { Header } from './header';
import { Padding } from './padding';
import Footer from './footer';

interface LayoutProps {
  children: React.ReactNode;
  headerComponent?: React.ReactNode;
  paddingClassName?: string;
}

export function Layout({ children, headerComponent, paddingClassName }: LayoutProps) {
  return (
    <>
      <Header>
        {headerComponent}
      </Header>
      <Padding className={paddingClassName}>
        {children}
      </Padding>
      <Footer />
    </>
  );
}
