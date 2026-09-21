export const roles = [
  ['community-operations', 'Community Operations', 'Community', 'Make our communities feel like somewhere people belong.', 'Tell us about a community you helped run. What did you improve?', 'A discussion is becoming heated and moderators disagree. How would you respond?'],
  ['player-support', 'Player Support', 'Community', 'Help players get back to the worlds they love.', 'How would you help a frustrated player who lost progress?', 'Write a short reply to a player reporting a bug you cannot reproduce.'],
  ['trust-safety', 'Trust & Safety', 'Community', 'Build safer spaces with thoughtful, consistent decisions.', 'How would you handle a harassment report with incomplete evidence?', 'A friend on the team breaks a community rule. What steps would you take?'],
  ['quality-assurance', 'Quality Assurance', 'Development', 'Find the rough edges. Help every release feel better.', 'Write a sample bug report with reproduction steps, expected behavior, and actual behavior.', 'You have one hour to test a release. How would you prioritize?'],
  ['game-development', 'Game Development', 'Development', 'Turn ambitious ideas into worlds that work.', 'Describe a Roblox or software system you built and a technical tradeoff you made.', 'How would you design a client/server interaction to prevent a player from granting themselves rewards?'],
  ['ui-ux-design', 'UI/UX Design', 'Creative', 'Make complex worlds intuitive, accessible, and a joy to explore.', 'Walk us through a design decision, from player need to tested solution.', 'How would you adapt a game inventory for phone, desktop, and controller?'],
  ['3d-art-building', '3D Art & Building', 'Creative', 'Give our worlds their shape, atmosphere, and sense of place.', 'Share a scene or asset and explain your contribution, tools, and constraints.', 'How do you balance visual detail with performance in a Roblox environment?'],
  ['vfx-animation', 'VFX & Animation', 'Creative', 'Bring movement, impact, and personality to every moment.', 'Describe an effect or animation you made and what you wanted players to feel.', 'How would you make an effect readable and performant on lower-end devices?'],
  ['content-creation', 'Content Creation', 'Creative', 'Tell the stories that bring new players into our worlds.', 'Share a piece of content you made and explain the audience and your contribution.', 'Pitch a short video introducing one of ANTVX’s worlds without promising unreleased features.'],
  ['social-media', 'Social Media', 'Community', 'Find the studio’s voice and start meaningful conversations.', 'Draft a short post inviting players to an upcoming playtest.', 'How would you respond to criticism of a delayed update?'],
  ['events', 'Events', 'Community', 'Create moments our communities will remember.', 'Outline a community event: goal, format, staffing, and success measures.', 'An event has a technical failure just after it starts. What is your backup plan?'],
  ['partnerships', 'Partnerships', 'Business', 'Build thoughtful relationships that help the studio grow.', 'What makes a creator or studio a good partner for ANTVX?', 'Draft a brief partnership pitch and explain how you would measure its success.']
].map(([id, title, category, description, ...questions]) => ({ id, title, category, description, questions }));
export const statuses = ['Submitted', 'In review', 'Interview', 'Offer', 'Accepted', 'Declined', 'Withdrawn'];
export const compensationTypes = ['Paid', 'Volunteer'];
export function validateApplication(data) {
  const role = roles.find(r => r.id === data.roleId);
  if (!role) throw new Error('Choose a valid role.');
  for (const key of ['name', 'email', 'timezone', 'availability', 'motivation', 'experience', 'answer1', 'answer2']) {
    if (typeof data[key] !== 'string' || !data[key].trim() || data[key].length > (['motivation','experience','answer1','answer2'].includes(key) ? 4000 : 200)) throw new Error('Complete all required fields within the character limits.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) throw new Error('Enter a valid email address.');
  if (data.portfolio && !/^https:\/\/[^\s]+$/i.test(data.portfolio)) throw new Error('Portfolio links must start with https://.');
  if (!data.consent) throw new Error('Please confirm the application privacy notice.');
  return data;
}
export function validateResume(file) {
  if (!file) return;
  if (file.type !== 'application/pdf' || !/\.pdf$/i.test(file.name)) throw new Error('Upload your resume as a PDF.');
  if (file.size === 0 || file.size > 5 * 1024 * 1024) throw new Error('Your PDF must be between 1 byte and 5 MB.');
}
