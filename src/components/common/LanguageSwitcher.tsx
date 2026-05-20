import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const change = (val: string) => {
    i18n.changeLanguage(val);
    document.documentElement.setAttribute("lang", val);
  };

  return (
    <Select value={i18n.language?.split("-")[0] || "en"} onValueChange={change}>
      <SelectTrigger className="w-[110px] h-9 gap-2">
        <Languages className="h-4 w-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">{t("language.english")}</SelectItem>
        <SelectItem value="hi">{t("language.hindi")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
