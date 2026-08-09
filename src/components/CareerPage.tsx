import { useState } from "react";
import { Check, Download, MapPin, MessageCircle, Timer, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";

const responsibilities = ["Customer Support", "Product Demo", "Lead Follow-up", "Sales Closing", "WhatsApp Communication", "Customer Onboarding", "Feedback Collection", "Referral Program Management", "Affiliate Partner Support", "CRM Update"];
const requirements = ["Good Communication Skill", "Honest", "Responsible", "Fast Learner", "Problem Solver", "Customer Friendly", "Basic Computer Knowledge", "Internet Knowledge", "Bangla Speaking", "English Reading Ability"];
const process = ["Apply", "CV Review", "Syllabus Download", "Oral Interview", "Trial Period", "Final Selection", "Welcome to Ristop™"];
const values = ["Integrity", "Justice", "Customer First", "Continuous Learning", "Teamwork", "Respect", "Excellence"];
const benefits = ["Remote Work", "Flexible Working Hours", "Learning Opportunity", "Career Growth", "Friendly Environment", "Performance Bonus", "Startup Experience"];

export function CareerPage() {
  const { lang } = useI18n();
  const bn = lang === "bn";
  const [applicant, setApplicant] = useState({ name: "", phone: "", location: "", education: "", experience: "" });
  const apply = () => {
    const message = `Hello Ristop Team,\n\nI want to apply for the Growth & Customer Success Executive position.\n\nMy Name: ${applicant.name}\nPhone: ${applicant.phone}\nLocation: ${applicant.location}\nEducation: ${applicant.education}\nExperience: ${applicant.experience}`;
    window.open(`https://wa.me/8801317680620?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };
  return <div className="space-y-12">
    <section><span className="inline-flex rounded-full border border-success/40 bg-success/10 px-3 py-1 text-xs text-success">● Hiring Now</span><h2 className="mt-4 text-3xl md:text-5xl font-bold text-gradient">Join the Future of Business Technology</h2><p className="mt-3 text-lg">{bn ? "Ristop™-এর সাথে ভবিষ্যৎ গড়ুন।" : "Build the future with Ristop™."}</p><p className="mt-2 text-muted-foreground">Join our mission to build the world's most trusted business ecosystem.</p></section>
    <section className="rounded-2xl glass-strong border border-primary/30 p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase text-primary-glow">Current open position</p><h2 className="mt-2 text-2xl font-bold">Growth & Customer Success Executive</h2><div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Wifi className="h-4 w-4"/>Remote</span><span className="flex items-center gap-1"><Timer className="h-4 w-4"/>Full Time · 0–2 Years</span><span className="flex items-center gap-1"><MapPin className="h-4 w-4"/>Remote / Bangladesh</span></div></div><a href="/ristop-interview-syllabus.pdf" download="Ristop-Interview-Syllabus.pdf"><Button variant="outline"><Download className="h-4 w-4 mr-2"/>Download Interview Syllabus</Button></a></div></section>
    <div className="grid gap-6 md:grid-cols-2"><List title="Responsibilities" items={responsibilities}/><List title="Requirements" items={requirements}/></div>
    <section><h2 className="text-2xl font-bold">Hiring Process</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{process.map((item,index)=><div key={item} className="rounded-xl glass border border-border p-4"><span className="text-primary-glow font-bold">{String(index+1).padStart(2,"0")}</span><p className="mt-2 font-semibold">{item}</p></div>)}</div></section>
    <div className="grid gap-6 md:grid-cols-2"><List title="Core Values" items={values}/><List title="Benefits" items={benefits}/></div>
    <section><h2 className="text-2xl font-bold">FAQ</h2><Accordion type="single" collapsible className="mt-4 rounded-2xl glass px-5">{[["Can I work remotely?","Yes. This position is remote within Bangladesh."],["Is experience required?","No. Applicants with 0–2 years of experience may apply."],["How does the interview work?","After CV review, download the syllabus and attend an oral interview."],["Will training be provided?","Yes. Product, workflow and customer communication training are included."],["How long is probation?","The final duration is explained during selection after the trial period."]].map(([q,a],i)=><AccordionItem key={q} value={`faq-${i}`}><AccordionTrigger>{q}</AccordionTrigger><AccordionContent className="text-muted-foreground">{a}</AccordionContent></AccordionItem>)}</Accordion></section>
    <section className="rounded-2xl glass-strong border border-primary/30 p-6"><h2 className="text-2xl font-bold">Apply on WhatsApp</h2><p className="mt-2 text-sm text-muted-foreground">Complete the details below; WhatsApp will open with a ready-to-send application.</p><div className="mt-5 grid gap-3 md:grid-cols-2">{Object.entries(applicant).map(([key,value])=><div key={key}><Label>{key}</Label><Input value={value} onChange={(e)=>setApplicant((old)=>({...old,[key]:e.target.value}))} className="mt-1"/></div>)}<div className="md:col-span-2"><Button onClick={apply} disabled={!applicant.name.trim() || !applicant.phone.trim()} className="bg-gradient-primary shadow-glow"><MessageCircle className="h-4 w-4 mr-2"/>Apply for this position</Button></div></div></section>
  </div>;
}

function List({ title, items }: { title: string; items: string[] }) { return <section><h2 className="text-2xl font-bold">{title}</h2><div className="mt-4 grid gap-2 sm:grid-cols-2">{items.map((item)=><div key={item} className="flex items-start gap-2 rounded-xl border border-border bg-secondary/30 p-3 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success"/>{item}</div>)}</div></section>; }