import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { abbreviateText, stateAbbreviations } from "@/lib/abbreviation-utils";

type AbbreviationExampleProps = {
  text: string;
};

export const AbbreviationExample = ({ text }: AbbreviationExampleProps) => {
  const stateAbbreviated = abbreviateText(text, stateAbbreviations);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Abbreviation Examples</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="mb-2 font-semibold">Original Text:</h3>
          <p className="text-muted-foreground">{text}</p>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">State Abbreviations:</h3>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{stateAbbreviated}</Badge>
            {stateAbbreviated !== text && (
              <Badge className="text-xs" variant="secondary">
                Changed
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Example usage component
export const AbbreviationDemo = () => {
  const examples = [
    "New South Wales Television Network",
    "Victoria Broadcasting Service",
    "Queensland Digital Channel",
    "Western Australia High Definition",
    "Australian Capital Territory News",
    "Northern Territory Weather",
  ];

  return (
    <div className="space-y-6 p-4">
      <h2 className="font-bold text-2xl">Abbreviation System Demo</h2>
      <p className="text-muted-foreground">
        This demonstrates how the abbreviation system works with different word
        lists.
      </p>

      <div className="grid gap-4">
        {examples.map((example) => (
          <AbbreviationExample key={example} text={example} />
        ))}
      </div>
    </div>
  );
};
