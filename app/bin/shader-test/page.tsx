"use client";

import { useState } from "react";
import MatrixGridBackground from "@/components/ui/matrix-grid-background";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function ShaderTestPage() {
  const [enableWave, setEnableWave] = useState(true);
  const [enableMouseHover, setEnableMouseHover] = useState(true);
  const [enableCardBorder, setEnableCardBorder] = useState(true);

  return (
    <>
      {/* Matrix Grid Background with controllable animations */}
      <MatrixGridBackground
        enableWaveAnimation={enableWave}
        enableMouseHoverAnimation={enableMouseHover}
        enableCardBorderAnimation={enableCardBorder}
      />

      {/* Content */}
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Shader Animation Test</h1>
            <p className="text-muted-foreground">
              Test the granular animation controls for the MatrixGridBackground
              component
            </p>
          </div>

          {/* Animation Controls */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Animation Controls</CardTitle>
              <CardDescription>
                Toggle different animation types to see the effects on the
                background grid
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="wave-animation">Wave Animation</Label>
                  <p className="text-sm text-muted-foreground">
                    Animated bleeding borders flowing from top to bottom
                  </p>
                </div>
                <Switch
                  id="wave-animation"
                  checked={enableWave}
                  onCheckedChange={setEnableWave}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mouse-hover">Mouse Hover Animation</Label>
                  <p className="text-sm text-muted-foreground">
                    Glow effects that follow your mouse cursor
                  </p>
                </div>
                <Switch
                  id="mouse-hover"
                  checked={enableMouseHover}
                  onCheckedChange={setEnableMouseHover}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="card-border">Card Border Animation</Label>
                  <p className="text-sm text-muted-foreground">
                    Special glow effects around hovered cards (hover the cards
                    below)
                  </p>
                </div>
                <Switch
                  id="card-border"
                  checked={enableCardBorder}
                  onCheckedChange={setEnableCardBorder}
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEnableWave(true);
                      setEnableMouseHover(true);
                      setEnableCardBorder(true);
                    }}
                  >
                    Enable All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEnableWave(false);
                      setEnableMouseHover(false);
                      setEnableCardBorder(false);
                    }}
                  >
                    Disable All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Cards for Card Border Animation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Test Card 1</CardTitle>
                <CardDescription>
                  Hover me to see card border effects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  This card should trigger special border glow effects when
                  hovered, but only if the Card Border Animation is enabled.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Test Card 2</CardTitle>
                <CardDescription>Another test card</CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  Move your mouse around the page to see the mouse hover
                  animation effects on the background grid.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Test Card 3</CardTitle>
                <CardDescription>Wave animation test</CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  The wave animation creates flowing patterns from top to
                  bottom. Toggle it on and off to see the difference.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Testing Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold">Wave Animation:</h4>
                <p className="text-sm text-muted-foreground">
                  Look at the background grid. You should see subtle flowing
                  patterns moving from top to bottom when enabled.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Mouse Hover Animation:</h4>
                <p className="text-sm text-muted-foreground">
                  Move your mouse around the page. You should see a glowing
                  effect around your cursor that affects nearby grid cells.
                </p>
              </div>
              <div>
                <h4 className="font-semibold">Card Border Animation:</h4>
                <p className="text-sm text-muted-foreground">
                  Hover over the test cards above. You should see subtle glow
                  effects in the background grid around the card boundaries.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
