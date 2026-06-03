import { useI18n } from "@/lib/i18n";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setLang(lang === "bn" ? "en" : "bn")}
      className="gap-2 glass border-primary/30"
    >
      <Languages className="h-4 w-4" />
      {lang === "bn" ? "বাংলা" : "English"}
    </Button>
  );
}
