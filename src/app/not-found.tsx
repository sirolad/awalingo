import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { APP_NAME } from '@/lib/brand';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <Image
          src="/assets/404/not-found.png"
          alt="Page not found"
          width={400}
          height={300}
          className="mx-auto dark:invert dark:brightness-110"
          priority
        />

        <div className="space-y-2">
          <h1 className="font-parkinsans text-3xl font-bold text-foreground">
            Page Not Found
          </h1>
          <p className="font-metropolis text-muted-foreground">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It
            may have been moved or doesn&apos;t exist.
          </p>
        </div>

        <Button asChild size="lg" className="w-full">
          <Link href="/home">Back to {APP_NAME}</Link>
        </Button>
      </div>
    </div>
  );
}
