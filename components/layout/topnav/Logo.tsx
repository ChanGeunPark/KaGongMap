import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 text-fg font-semibold text-[19px] tracking-[-0.3px] shrink-0 transition-opacity hover:opacity-80"
    >
      <Image
        src="/images/logo.png"
        alt="카공맵"
        width={120}
        height={50}
        className="object-cover"
      />
    </Link>
  );
}
