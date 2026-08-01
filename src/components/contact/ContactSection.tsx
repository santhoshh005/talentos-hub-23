import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Linkedin,
  Instagram,
  Clock,
  MapPin,
  Send,
  CheckCircle2,
  ArrowUpRight,
  MessageSquare,
} from "lucide-react";
import emailjs from "@emailjs/browser";
import { toast } from "sonner";

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const CONTACT_EMAIL = "hemanthhemu1104@gmail.com";

const contactLinks = [
  {
    id: "email",
    label: "Email",
    value: CONTACT_EMAIL,
    href: `mailto:${CONTACT_EMAIL}`,
    icon: Mail,
    color: "rgba(37, 99, 235, 0.45)",
    iconTint: "text-[#60A5FA]",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    value: "Connect with me",
    href: "https://www.linkedin.com/in/hemanth-kumar-235078270",
    icon: Linkedin,
    color: "rgba(56, 189, 248, 0.45)",
    iconTint: "text-[#38BDF8]",
  },
  {
    id: "instagram",
    label: "Instagram",
    value: "@heyyy.m_ant",
    href: "https://www.instagram.com/heyyy.m_ant/",
    icon: Instagram,
    color: "rgba(244, 63, 94, 0.45)",
    iconTint: "text-[#FB7185]",
  },
  {
    id: "location",
    label: "Location",
    value: "India · Remote",
    href: "https://www.google.com/maps/place/India",
    icon: MapPin,
    color: "rgba(45, 212, 191, 0.45)",
    iconTint: "text-[#5EEAD4]",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

export function ContactSection() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = (data: FormData): FormErrors => {
    const newErrors: FormErrors = {};
    if (!data.name.trim() || data.name.length < 2) {
      newErrors.name = "Please enter your name.";
    }
    if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = "Please enter a valid email.";
    }
    if (!data.subject.trim() || data.subject.length < 3) {
      newErrors.subject = "Please enter a subject.";
    }
    if (!data.message.trim() || data.message.length < 10) {
      newErrors.message = "Message must be at least 10 characters.";
    }
    return newErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID || "YOUR_SERVICE_ID",
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "YOUR_TEMPLATE_ID",
        {
          name: formData.name,
          from_name: formData.name,
          reply_to: formData.email,
          subject: formData.subject,
          message: formData.message,
          time: new Date().toLocaleString(),
        },
        {
          publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "YOUR_PUBLIC_KEY",
        },
      );
      toast.success("Message sent successfully!");
      setIsSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("[EmailJS] Failed to send email:", error);
      toast.error("Failed to send message. Please try once again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-6xl px-4 pb-8">
      {/* Blue glowing background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-[#2563EB]/25 blur-[120px] animate-pulse"
          style={{ animationDuration: "6s" }}
        />
        <div
          className="absolute -right-24 top-40 h-[380px] w-[380px] rounded-full bg-[#38BDF8]/20 blur-[110px] animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div className="absolute left-1/2 bottom-0 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-[#1D4ED8]/20 blur-[130px]" />
      </div>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        {/* Left: Contact info */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="flex flex-col justify-start"
        >
          <motion.div variants={itemVariants} className="mb-8">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              Let's talk about your next hire.
            </h3>
            <p className="mt-3 text-muted-foreground">
              Whether you're scaling an engineering team, looking for AI-powered recruiting
              workflows, or want to collaborate on TalentOS — I'd love to hear from you.
            </p>
          </motion.div>

          {/* Contact links */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {contactLinks.map((link, i) => {
              const Icon = link.icon;
              const isExternal = link.id !== "email";
              return (
                <motion.a
                  key={link.id}
                  variants={itemVariants}
                  href={link.href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group relative flex items-center gap-4 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 backdrop-blur-xl transition-colors duration-300 hover:border-white/[0.18] hover:bg-white/[0.05]"
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(circle at 0% 50%, ${link.color} 0%, transparent 60%)`,
                    }}
                  />
                  <motion.div
                    className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
                    whileHover={{ scale: 1.15, rotate: -6 }}
                  >
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-xl opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100"
                      style={{ background: link.color }}
                    />
                    <Icon className={`relative h-5 w-5 ${link.iconTint}`} strokeWidth={1.6} />
                  </motion.div>
                  <div className="relative z-10 flex-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {link.label}
                    </p>
                    <p className="text-sm font-medium text-foreground">{link.value}</p>
                  </div>
                  <ArrowUpRight className="relative z-10 h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </motion.a>
              );
            })}
          </div>

          {/* Availability card */}
          <motion.div
            variants={itemVariants}
            className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </div>
              <span className="text-sm font-medium text-foreground">
                Available for collaborations
              </span>
            </div>
            <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>India · Remote</span>
            </div>
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Typical response: 24 hours</span>
            </div>
          </motion.div>

          {/* LinkedIn CTA */}
          <motion.a
            variants={itemVariants}
            href="https://www.linkedin.com/in/hemanth-kumar-235078270"
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-6 flex items-center gap-4 overflow-hidden rounded-xl border border-[#0A66C2]/30 bg-[#0A66C2]/10 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#0A66C2]/50 hover:bg-[#0A66C2]/15"
          >
            <div className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#0A66C2]/30 bg-[#0A66C2]/20 transition-transform duration-300 group-hover:scale-110">
              <Linkedin className="h-5 w-5 text-[#38BDF8]" strokeWidth={1.5} />
            </div>
            <div className="relative z-10 flex-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Let's connect
              </p>
              <p className="text-sm font-medium text-foreground">Connect on LinkedIn</p>
            </div>
            <ArrowUpRight className="relative z-10 h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </motion.a>
        </motion.div>

        {/* Right: Contact form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 backdrop-blur-xl md:p-8"
        >
          {/* Radial glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-[#2563EB]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#38BDF8]/15 blur-3xl" />

          {isSuccess ? (
            <div className="relative z-10 flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-emerald-500/10">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h4 className="text-xl font-semibold text-foreground">Message sent!</h4>
              <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                Thanks for reaching out. I'll get back to you within 24 hours.
              </p>
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-white/[0.06]"
              >
                <MessageSquare className="h-4 w-4" />
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="name"
                    className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className={`w-full rounded-lg border bg-white/[0.03] px-3.5 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-primary/20 ${
                      errors.name ? "border-red-500/50" : "border-white/10"
                    }`}
                  />
                  {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@company.com"
                    className={`w-full rounded-lg border bg-white/[0.03] px-3.5 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-primary/20 ${
                      errors.email ? "border-red-500/50" : "border-white/10"
                    }`}
                  />
                  {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="subject"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Subject
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What's this about?"
                  className={`w-full rounded-lg border bg-white/[0.03] px-3.5 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-primary/20 ${
                    errors.subject ? "border-red-500/50" : "border-white/10"
                  }`}
                />
                {errors.subject && <p className="text-xs text-red-400">{errors.subject}</p>}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="message"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell me about your role, team, or idea..."
                  rows={5}
                  className={`w-full resize-none rounded-lg border bg-white/[0.03] px-3.5 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary/50 focus:bg-white/[0.05] focus:ring-1 focus:ring-primary/20 ${
                    errors.message ? "border-red-500/50" : "border-white/10"
                  }`}
                />
                {errors.message && <p className="text-xs text-red-400">{errors.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-medium text-white shadow-[0_20px_60px_-20px] shadow-primary/70 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Sending...
                  </span>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
