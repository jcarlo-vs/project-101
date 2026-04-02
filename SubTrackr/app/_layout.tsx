import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { WelcomeCurrencyModal } from "@/components/welcome-currency-modal";
import { BillProvider } from "@/context/BillContext";
import { BudgetProvider } from "@/context/BudgetContext";
import { CreditCardProvider } from "@/context/CreditCardContext";
import { CurrencyProvider, useCurrency } from "@/context/CurrencyContext";
import { ExpenseProvider } from "@/context/ExpenseContext";
import { LoanProvider } from "@/context/LoanContext";
import { SubscriptionProvider } from "@/context/SubscriptionContext";

const FinvyDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#0A0A0F",
    card: "#0A0A0F",
  },
};

export const unstable_settings = {
  anchor: "(tabs)",
};

function AppContent() {
  const { isFirstLaunch, isLoading, setCurrency } = useCurrency();

  if (isLoading) return null;

  return (
    <SubscriptionProvider>
      <CreditCardProvider>
        <BillProvider>
          <ExpenseProvider>
            <BudgetProvider>
              <LoanProvider>
                <ThemeProvider value={FinvyDarkTheme}>
                  <Stack>
                    <Stack.Screen
                      name="(tabs)"
                      options={{ headerShown: false }}
                    />
                    <Stack.Screen
                      name="add-subscription"
                      options={{ presentation: "modal", headerShown: false }}
                    />
                    <Stack.Screen
                      name="add-credit-card"
                      options={{ presentation: "modal", headerShown: false }}
                    />
                    <Stack.Screen
                      name="credit-card-detail"
                      options={{ presentation: "modal", headerShown: false }}
                    />
                    <Stack.Screen
                      name="add-bill"
                      options={{ presentation: "modal", headerShown: false }}
                    />
                    <Stack.Screen
                      name="add-loan"
                      options={{ presentation: "modal", headerShown: false }}
                    />
                    <Stack.Screen
                      name="add-expense"
                      options={{ presentation: "modal", headerShown: false }}
                    />
                    <Stack.Screen
                      name="manage-income"
                      options={{ presentation: "modal", headerShown: false }}
                    />
                  </Stack>
                  <StatusBar style="light" />
                </ThemeProvider>

                <WelcomeCurrencyModal
                  visible={isFirstLaunch}
                  onSelect={setCurrency}
                />
              </LoanProvider>
            </BudgetProvider>
          </ExpenseProvider>
        </BillProvider>
      </CreditCardProvider>
    </SubscriptionProvider>
  );
}

export default function RootLayout() {
  return (
    <CurrencyProvider>
      <AppContent />
    </CurrencyProvider>
  );
}
