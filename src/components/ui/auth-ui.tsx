import { useState, useId, forwardRef, type ElementRef, type ComponentPropsWithoutRef, type ButtonHTMLAttributes, type ComponentProps, type InputHTMLAttributes, type FormEvent } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// UTILITY: cn function for merging Tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- BUILT-IN UI COMPONENTS (No changes here) ---

// COMPONENT: Label
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);
const Label = forwardRef<
  ElementRef<typeof LabelPrimitive.Root>,
  ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

// COMPONENT: Button
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-smans-primary text-white hover:bg-smans-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input dark:border-input/50 bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-foreground/60 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-6",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

// COMPONENT: Input
const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input dark:border-input/50 bg-background px-3 py-3 text-sm text-foreground shadow-sm shadow-black/5 transition-shadow placeholder:text-muted-foreground/70 focus-visible:bg-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// COMPONENT: PasswordInput
export interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}
const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, ...props }, ref) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
    return (
      <div className="grid w-full items-center gap-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="relative">
          <Input id={id} type={showPassword ? "text" : "password"} className={cn("pe-10", className)} ref={ref} {...props} />
          <button type="button" onClick={togglePasswordVisibility} className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? (<EyeOff className="size-4" aria-hidden="true" />) : (<Eye className="size-4" aria-hidden="true" />)}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

// --- FORMS & AUTH LOGIC ---

interface AuthFormProps {
  onSubmit: (email: string, password: string, name?: string) => void;
  isLoading?: boolean;
}

// FORM: SignInForm
function SignInForm({ onSubmit, isLoading }: AuthFormProps) {
  const handleSignIn = (event: FormEvent<HTMLFormElement>) => { 
    event.preventDefault(); 
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    onSubmit(email, password);
  };
  
  return (
    <form onSubmit={handleSignIn} autoComplete="on" className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Inloggen bij SMANS</h1>
        <p className="text-balance text-sm text-muted-foreground">Voer uw gegevens in om in te loggen</p>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">E-mailadres</Label>
          <Input id="email" name="email" type="email" placeholder="naam@smans.nl" required autoComplete="email" />
        </div>
        <PasswordInput name="password" label="Wachtwoord" required autoComplete="current-password" placeholder="••••••••" />
        <Button type="submit" className="mt-2 bg-smans-primary hover:bg-smans-primary/90" disabled={isLoading}>
          {isLoading ? 'Bezig met inloggen...' : 'Inloggen'}
        </Button>
      </div>
    </form>
  );
}

// FORM: SignUpForm
function SignUpForm({ onSubmit, isLoading }: AuthFormProps) {
  const handleSignUp = (event: FormEvent<HTMLFormElement>) => { 
    event.preventDefault(); 
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    onSubmit(email, password, name);
  };
  
  return (
    <form onSubmit={handleSignUp} autoComplete="on" className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Account aanmaken</h1>
        <p className="text-balance text-sm text-muted-foreground">Voer uw gegevens in om een account aan te maken</p>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-1">
          <Label htmlFor="name">Volledige naam</Label>
          <Input id="name" name="name" type="text" placeholder="Jan de Vries" required autoComplete="name" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">E-mailadres</Label>
          <Input id="email" name="email" type="email" placeholder="naam@smans.nl" required autoComplete="email" />
        </div>
        <PasswordInput name="password" label="Wachtwoord" required autoComplete="new-password" placeholder="••••••••"/>
        <Button type="submit" className="mt-2 bg-smans-primary hover:bg-smans-primary/90" disabled={isLoading}>
          {isLoading ? 'Account aanmaken...' : 'Account aanmaken'}
        </Button>
      </div>
    </form>
  );
}

// CONTAINER for the forms to handle state switching
interface AuthFormContainerProps {
  onLogin: (email: string, password: string, name?: string) => void;
  isLoading?: boolean;
}

function AuthFormContainer({ onLogin, isLoading }: AuthFormContainerProps) {
    return (
        <div className="mx-auto grid w-[350px] gap-2">
            <SignInForm onSubmit={onLogin} isLoading={isLoading} />
        </div>
    )
}

// --- MAIN EXPORTED COMPONENT ---

interface AuthUIProps {
    image?: {
        src: string;
        alt: string;
    };
    quote?: {
        text: string;
        author: string;
    };
    onLogin: (email: string, password: string, name?: string) => void;
    isLoading?: boolean;
}

const defaultImage = {
    src: "/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png",
    alt: "SMANS Logo"
};

const defaultQuote = {
    text: "SMANS CRM helpt ons om onze klanten beter te bedienen en projecten efficiënter te beheren.",
    author: "SMANS Team"
}

export function AuthUI({ image = defaultImage, quote = defaultQuote, onLogin, isLoading }: AuthUIProps) {
  return (
    <div className="w-full min-h-screen md:grid md:grid-cols-2">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>

      {/* Left Column: The Form */}
      <div className="flex h-screen items-center justify-center p-6 md:h-auto md:p-0 md:py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img 
              src="/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" 
              alt="SMANS Logo" 
              className="mx-auto h-12 w-auto mb-6"
            />
          </div>
          <AuthFormContainer onLogin={onLogin} isLoading={isLoading} />
        </div>
      </div>

      {/* Right Column: SMANS branded background */}
      <div className="hidden md:block relative bg-gradient-to-br from-smans-primary to-red-700">
        {/* Overlay pattern */}
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Centered Quote */}
        <div className="relative z-10 flex h-full items-center justify-center p-10">
            <blockquote className="space-y-4 text-center text-white max-w-md">
              <div className="mb-8">
                <img 
                  src="/lovable-uploads/ad3fa40e-af0e-42d9-910f-59eab7f8e4ed.png" 
                  alt="SMANS Logo" 
                  className="mx-auto h-16 w-auto brightness-0 invert"
                />
              </div>
              <p className="text-lg font-medium leading-relaxed">"{quote.text}"</p>
              <cite className="block text-sm font-light text-white/80 not-italic">
                  — {quote.author}
              </cite>
            </blockquote>
        </div>
      </div>
    </div>
  );
}
