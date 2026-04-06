import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 no-underline">
      <div className="relative h-[26px] w-[26px]">
        <div className="absolute left-0 top-0 h-[18px] w-[18px] rounded-[5px] bg-teal-700 opacity-80" />
        <div className="absolute bottom-0 right-0 h-[18px] w-[18px] rounded-[5px] bg-[#b7791f] opacity-80" />
      </div>
      <span className="text-sm font-bold tracking-tight text-foreground">CollabSpace</span>
    </Link>
  );
}
