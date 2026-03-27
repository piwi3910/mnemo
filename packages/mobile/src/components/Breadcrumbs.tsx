import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors, fontSize, spacing } from "../lib/theme";

interface BreadcrumbsProps {
  path: string;
}

export default function Breadcrumbs({ path }: BreadcrumbsProps) {
  const router = useRouter();
  const segments = path.split("/").filter(Boolean);

  return (
    <View style={styles.container}>
      {segments.map((segment, index) => {
        const isLast = index === segments.length - 1;
        // Build accumulated path up to this segment (excluding the final file segment)
        const partialPath = segments.slice(0, index + 1).join("/");
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <Text style={styles.separator}>/</Text>
            )}
            {isLast ? (
              <Text style={styles.current} numberOfLines={1}>
                {segment}
              </Text>
            ) : (
              <TouchableOpacity
                onPress={() =>
                  router.push(
                    `/(app)/(tabs)/notes?folder=${encodeURIComponent(partialPath)}` as never
                  )
                }
              >
                <Text style={styles.segment} numberOfLines={1}>
                  {segment}
                </Text>
              </TouchableOpacity>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  segment: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  separator: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginHorizontal: spacing.xs,
  },
  current: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: "600",
  },
});
