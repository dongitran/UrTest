import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TestSuccessRate() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Test Success Rate</CardTitle>
          <Select defaultValue="7days">
            <SelectTrigger className="w-[130px] h-8">
              <SelectValue placeholder="Last 7 days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="text-sm font-medium">Authentication</div>
              <div className="text-xs text-muted-foreground">95%</div>
            </div>
            <div className="w-2/3">
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: "95%" }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="text-sm font-medium">Search</div>
              <div className="text-xs text-muted-foreground">75%</div>
            </div>
            <div className="w-2/3">
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-yellow-500"
                  style={{ width: "75%" }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="text-sm font-medium">Product</div>
              <div className="text-xs text-muted-foreground">90%</div>
            </div>
            <div className="w-2/3">
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: "90%" }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="text-sm font-medium">Cart</div>
              <div className="text-xs text-muted-foreground">60%</div>
            </div>
            <div className="w-2/3">
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-yellow-500"
                  style={{ width: "60%" }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="text-sm font-medium">Checkout</div>
              <div className="text-xs text-muted-foreground">85%</div>
            </div>
            <div className="w-2/3">
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: "85%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
