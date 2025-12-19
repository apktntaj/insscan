"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navbar = ({ links }) => {
  const pathname = usePathname();

  // Hide navbar on homepage
  if (pathname === "/") {
    return null;
  }

  return (
    <nav className='navbar bg-base-100 font-bold mt-5'>
      <div className='navbar-start'>
        {/* DROPDOWN */}
        <div className='dropdown'>
          <div tabIndex={0} role='button' className='btn btn-ghost lg:hidden'>
            {/* HAMBURGER MENU */}
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M4 6h16M4 12h8m-8 6h16'
              />
            </svg>
          </div>
          {/* ITEM LINK */}
          <ul
            tabIndex={0}
            className='menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52'
          >
            {links.map((link, idx) => (
              <li key={idx}>
                <Link
                  className='text-slate-600 drop-shadow-sm'
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* LOGO */}
        <div>
          <div>
            <Link
              className='flex items-center space-x-2 text-3xl tracking-wider'
              href={"/"}
            >
              <Image
                src={"/invoicer.png"}
                width={50}
                height={50}
                alt='Logo Rayefy'
                className='rounded-full'
              />
              <span className='bg-gradient-to-r from-purple-400 via-emerald-500 to-sky-400 bg-clip-text text-transparent font-extrabold'>
                Semestaku
              </span>
            </Link>
          </div>
        </div>
      </div>
      <div className='navbar-end hidden lg:flex'>
        <ul className='menu menu-horizontal px-1'>
          {links.map((link, idx) => (
            <li key={idx}>
              <Link className='text-slate-600 drop-shadow-sm' href={link.href}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
