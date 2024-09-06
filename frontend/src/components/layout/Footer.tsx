'use client';

import React, { useEffect, useState } from 'react';
// import dayjs from 'dayjs';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = () => {
  const [xmltvDataSource, setXmltvDataSource] = useState<string>('unset');
  const [clientTimezone, setClientTimezone] = useState<string>('unset');

  useEffect(() => {
    const storedDataSource = localStorage.getItem('xmltvdatasource') || 'unset';
    setXmltvDataSource(storedDataSource);
    // const timeZone = dayjs.tz.guess();
    // setClientTimezone(timeZone);
  }, []);

  return (
    <footer className="rounded-lg bg-white px-4 py-1 antialiased shadow sm:flex sm:items-center sm:justify-between dark:bg-gray-800">
      <p className="mb-4 text-center text-sm text-gray-500 sm:mb-0 dark:text-gray-400">
        Data Source: <span className="font-medium">{xmltvDataSource}</span>
      </p>{' '}
      {/* <p className="mb-4 text-center text-sm text-gray-500 sm:mb-0 dark:text-gray-400">
        Timezone: <span className="font-medium">{clientTimezone}</span>
      </p> */}
      <div className="flex items-center justify-center space-x-1">
        <a
          href="#"
          data-tooltip-target="tooltip-github"
          className="inline-flex cursor-pointer justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-white"
        >
          <svg
            className="size-4"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 .333A9.911 9.911 0 0 0 6.866 19.65c.5.092.678-.215.678-.477 0-.237-.01-1.017-.014-1.845-2.757.6-3.338-1.169-3.338-1.169a2.627 2.627 0 0 0-1.1-1.451c-.9-.615.07-.6.07-.6a2.084 2.084 0 0 1 1.518 1.021 2.11 2.11 0 0 0 2.884.823c.044-.503.268-.973.63-1.325-2.2-.25-4.516-1.1-4.516-4.9A3.832 3.832 0 0 1 4.7 7.068a3.56 3.56 0 0 1 .095-2.623s.832-.266 2.726 1.016a9.409 9.409 0 0 1 4.962 0c1.89-1.282 2.717-1.016 2.717-1.016.366.83.402 1.768.1 2.623a3.827 3.827 0 0 1 1.02 2.659c0 3.807-2.319 4.644-4.525 4.889a2.366 2.366 0 0 1 .673 1.834c0 1.326-.012 2.394-.012 2.72 0 .263.18.572.681.475A9.911 9.911 0 0 0 10 .333Z"
              clipRule="evenodd"
            />
          </svg>
          <span className="sr-only">Github</span>
        </a>
        <div
          id="tooltip-github"
          role="tooltip"
          className="tooltip invisible absolute z-10 inline-block rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white opacity-0 shadow-sm transition-opacity duration-300 dark:bg-gray-700"
        >
          Star us on GitHub
          <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
