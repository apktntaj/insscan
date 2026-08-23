/**
 * Title Component
 * Presentation Layer - Common UI component
 */
import { Badge } from "@/components/ui/badge";

interface TitleProps {
    title: string;
    descs?: string[];
    variant?: "default" | "modern";
    eyebrow?: string;
}

export default function Title({
    title,
    descs = [],
    variant = "default",
    eyebrow = "",
}: TitleProps) {
    return (
        <section className={variant === "modern" ? "py-4 sm:py-6" : "py-8 sm:py-10"}>
            {eyebrow ? <Badge variant="secondary">{eyebrow}</Badge> : null}
            <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                {title}
            </h1>
            <div className="mt-3 flex max-w-3xl flex-col gap-1">
                {descs.map((desc, index) => (
                    <p key={index} className="text-sm leading-6 text-muted-foreground sm:text-base">
                        {desc}
                    </p>
                ))}
            </div>
        </section>
    );
}
