// ========================================================
// Vyapar Pro - Multi-User Management & Role-Based Access Control (RBAC)
// Roles: Admin, Accountant, Biller, Sales Executive + Security Audit Trail
// ========================================================

window.UsersModule = {
  render(container) {
    const users = window.Store.getUsers();
    const currentUser = window.Store.getCurrentUser();
    const auditLogs = window.Store.getAuditLogs();

    container.innerHTML = `
      <!-- Active User Profile Banner (Reduced Vertical Expansion, Full Horizontal Expansion) -->
      <div class="card" style="width:100%;margin-bottom:1.5rem;background:linear-gradient(135deg, #090d16 0%, #151d30 100%);color:#fff;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:0.75rem 1.25rem;box-shadow:0 4px 16px rgba(15,23,42,0.2);">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.75rem;">
          <div style="display:flex;align-items:center;gap:1rem;">
            <div style="font-size:2rem;background:rgba(255,255,255,0.1);width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:50%;border:2px solid rgba(255,255,255,0.2);">
              ${currentUser.avatar || '👨‍💼'}
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:0.5rem;">
                <h2 style="font-size:1.25rem;font-weight:800;color:#fff;margin:0;">${currentUser.name}</h2>
                <span class="brand-badge" style="background:#ed1a3b;color:#fff;font-size:11px;padding:2px 6px;">${currentUser.role}</span>
              </div>
              <div style="color:#94a3b8;font-size:0.85rem;margin-top:2px;">
                ${currentUser.title} • Active Session (${currentUser.email})
              </div>
            </div>
          </div>
          <div style="display:flex;gap:0.75rem;">
            <button class="btn btn-primary" id="switchUserQuickBtn" style="font-size:12.5px;padding:6px 12px;border-radius:7px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span>Switch User</span>
            </button>
            <button class="btn btn-outline" id="addNewUserBtn" style="color:#fff;border-color:rgba(255,255,255,0.3);font-size:12.5px;padding:6px 12px;border-radius:7px;">
              <span>+ Add User</span>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Vyapar Company Sharing & Multi-User Business Access -->
      <div class="card" style="margin-bottom:2rem;">
        <div class="card-header" style="flex-wrap:wrap;gap:0.75rem;">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <span class="brand-badge" style="background:#0284c7;color:#fff;">MULTI-USER ACCESS</span>
            <h2 class="card-title">Authorized Company Members (Vyapar Multi-User Model)</h2>
            <span class="badge badge-info" id="teamMemberCountBadge">Loading...</span>
          </div>
          <button class="btn btn-primary btn-sm" id="inviteCompanyMemberBtn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
            <span>+ Invite Staff / Accountant</span>
          </button>
        </div>
        <div style="padding:1rem 1.25rem;">
          <div id="companyMembersContainer" style="color:var(--text-muted);font-size:0.9rem;">
            Loading authorized business members...
          </div>
          <div id="companyInvitationsContainer" style="margin-top:1.5rem;display:none;">
            <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:8px;">Pending Verified Invitations</div>
            <div id="pendingInvitationsList"></div>
          </div>
        </div>
      </div>

      <!-- User Directory Grid -->
      <div class="section-subhead" style="margin-bottom:1rem;">
        <h3 style="font-size:1.15rem;font-weight:700;">Local Counter Profiles & Quick PINs</h3>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:1rem;margin-bottom:2rem;">
        ${users.map(u => {
          const isCurrent = u.id === currentUser.id;
          return `
            <div class="card" style="position:relative;border:${isCurrent ? '2px solid #ed1a3b' : '1px solid var(--border-subtle)'};">
              ${isCurrent ? `
                <div style="position:absolute;top:12px;right:12px;">
                  <span class="badge badge-success">ACTIVE LOGGED-IN</span>
                </div>
              ` : `
                <button class="btn btn-sm btn-outline select-user-btn" data-id="${u.id}" style="position:absolute;top:12px;right:12px;">
                  Switch Here
                </button>
              `}
              <div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.75rem;">
                <div style="font-size:2.2rem;background:var(--bg-app);width:52px;height:52px;display:flex;align-items:center;justify-content:center;border-radius:12px;border:1px solid var(--border-subtle);">
                  ${u.avatar || '🧑‍💻'}
                </div>
                <div>
                  <div style="font-weight:700;font-size:1.05rem;color:var(--text-main);">${u.name}</div>
                  <div style="font-size:0.8rem;color:var(--text-muted);">${u.title}</div>
                </div>
              </div>
              <div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.75rem;line-height:1.4;">
                <div>📞 ${u.phone || 'N/A'}</div>
                <div>✉️ ${u.email || 'N/A'}</div>
                <div style="margin-top:2px;">🔑 Security PIN: <b class="mono-val">${u.pin || '****'}</b></div>
              </div>
              <div style="border-top:1px solid var(--border-subtle);padding-top:0.75rem;">
                <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:4px;">Permissions</div>
                <div style="display:flex;flex-wrap:wrap;gap:4px;">
                  ${u.role === 'Admin' ? `
                    <span class="badge badge-danger">Full Master Access</span>
                  ` : (u.permissions || []).map(p => `
                    <span class="badge badge-info" style="font-size:10px;">${p.replace('_', ' ')}</span>
                  `).join('')}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Security Audit Trail -->
      <div class="card">
        <div class="card-header">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <h2 class="card-title">Security & Transaction Audit Trail</h2>
            <span class="badge badge-warning">${auditLogs.length} events logged</span>
          </div>
          <span style="font-size:12px;color:var(--text-muted);">Tamper-evident system activity ledger</span>
        </div>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th style="width:18%;">Timestamp</th>
                <th style="width:20%;">User & Role</th>
                <th style="width:22%;">Action Performed</th>
                <th style="width:40%;">Details & Scope</th>
              </tr>
            </thead>
            <tbody>
              ${auditLogs.slice(0, 20).map(log => `
                <tr>
                  <td class="mono-val" style="font-size:12px;color:var(--text-muted);">${log.timestamp}</td>
                  <td>
                    <div style="font-weight:700;color:var(--navy-900);">${log.userName}</div>
                  </td>
                  <td>
                    <span class="badge badge-info" style="font-weight:600;">${log.action}</span>
                  </td>
                  <td style="font-size:13px;color:var(--text-main);">${log.details}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Bind User Switch Buttons
    container.querySelectorAll('.select-user-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        this.switchUser(id, container);
      };
    });

    document.getElementById('switchUserQuickBtn').onclick = () => this.openSwitchModal(container);
    document.getElementById('addNewUserBtn').onclick = () => this.openAddUserModal(container);
    const inviteBtn = document.getElementById('inviteCompanyMemberBtn');
    if (inviteBtn) {
      inviteBtn.onclick = () => this.openInviteMemberModal(container);
    }

    // Load server-side company members & pending invitations
    this.loadCompanyMembers(container);
  },

  async loadCompanyMembers(container) {
    const membersBox = document.getElementById('companyMembersContainer');
    const badge = document.getElementById('teamMemberCountBadge');
    const invBox = document.getElementById('companyInvitationsContainer');
    const invList = document.getElementById('pendingInvitationsList');
    if (!membersBox) return;

    try {
      const [membersRes, invitesRes] = await Promise.all([
        window.Store.getBusinessMembers().catch(() => ({ members: [] })),
        window.Store.getBusinessInvitations().catch(() => ({ invitations: [] }))
      ]);

      const members = membersRes.members || [];
      const invitations = invitesRes.invitations || [];

      if (badge) badge.innerText = `${members.length} Active Member${members.length === 1 ? '' : 's'}`;

      if (members.length === 0) {
        membersBox.innerHTML = `<div style="padding:1rem;background:#f8fafc;border-radius:6px;text-align:center;">No authorized members found.</div>`;
      } else {
        const currentUser = window.Store.getCurrentUser();
        membersBox.innerHTML = `
          <div class="table-responsive">
            <table class="table" style="margin-bottom:0;">
              <thead>
                <tr>
                  <th style="width:25%;">Authorized User</th>
                  <th style="width:20%;">Assigned Role</th>
                  <th style="width:15%;">Status</th>
                  <th style="width:20%;">Joined Date</th>
                  <th style="width:20%;text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${members.map(m => {
                  const isOwner = m.role === 'Owner';
                  const roleBadgeClass = isOwner ? 'badge-danger' : m.role === 'Admin' ? 'badge-info' : 'badge-warning';
                  return `
                    <tr>
                      <td>
                        <div style="font-weight:700;color:var(--text-main);">${m.name || 'Staff Member'}</div>
                        <div style="font-size:12px;color:var(--text-muted);">${m.phone || m.email || m.userId}</div>
                      </td>
                      <td>
                        <span class="badge ${roleBadgeClass}">${m.role}</span>
                      </td>
                      <td>
                        <span class="badge badge-success">Authorized</span>
                      </td>
                      <td style="font-size:12px;color:var(--text-muted);">${m.joinedAt ? m.joinedAt.split('T')[0] : 'Active'}</td>
                      <td style="text-align:right;">
                        ${isOwner ? `
                          <span style="font-size:11px;color:var(--text-muted);font-weight:600;">Business Owner</span>
                        ` : `
                          <button class="btn btn-sm btn-danger revoke-member-btn" data-userid="${m.userId}" style="padding:2px 8px;font-size:11px;">
                            Revoke Access
                          </button>
                        `}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;

        // Bind revoke buttons
        membersBox.querySelectorAll('.revoke-member-btn').forEach(btn => {
          btn.onclick = async () => {
            const targetUserId = btn.getAttribute('data-userid');
            if (confirm("Are you sure you want to revoke this user's access? Their active sessions for this business will be terminated immediately.")) {
              btn.disabled = true;
              btn.innerText = 'Revoking...';
              try {
                await window.Store.revokeBusinessMember(targetUserId);
                if (window.app && window.app.showToast) {
                  window.app.showToast("User access revoked immediately.", "warning");
                }
                this.loadCompanyMembers(container);
              } catch (err) {
                alert(err.message || 'Failed to revoke access');
                btn.disabled = false;
                btn.innerText = 'Revoke Access';
              }
            }
          };
        });
      }

      if (invitations.length > 0 && invBox && invList) {
        invBox.style.display = 'block';
        invList.innerHTML = `
          <div style="display:flex;flex-direction:column;gap:0.5rem;">
            ${invitations.map(inv => {
              const displayName = inv.recipientName || inv.name || '';
              const contactInfo = inv.recipientPhone || inv.phone || inv.inviteePhone || inv.recipientEmail || inv.email || inv.inviteeEmail || 'Invited User';
              return `
              <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:0.75rem 1rem;border-radius:6px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div style="font-weight:700;font-size:0.9rem;color:#0f172a;">
                    ${displayName ? `<span>${displayName}</span> <span style="font-weight:500;color:#64748b;font-size:0.85rem;">(${contactInfo})</span>` : contactInfo}
                  </div>
                  <div style="font-size:0.8rem;color:#64748b;">Role: <strong>${inv.role}</strong> • Code: <code style="background:#e2e8f0;padding:1px 4px;border-radius:4px;">${inv.inviteToken}</code></div>
                </div>
                <div style="display:flex;align-items:center;gap:0.5rem;">
                  <button class="btn btn-sm btn-outline copy-invite-code-btn" data-token="${inv.inviteToken}" style="font-size:11px;padding:3px 8px;">
                    📋 Copy Token
                  </button>
                </div>
              </div>
            `;}).join('')}
          </div>
        `;

        invList.querySelectorAll('.copy-invite-code-btn').forEach(b => {
          b.onclick = () => {
            const token = b.getAttribute('data-token');
            navigator.clipboard?.writeText(token);
            if (window.app && window.app.showToast) {
              window.app.showToast(`Copied invite token: ${token}`, 'info');
            }
          };
        });
      } else if (invBox) {
        invBox.style.display = 'none';
      }
    } catch (err) {
      console.warn("Failed to load company members:", err);
      if (membersBox) membersBox.innerHTML = `<div style="color:var(--text-muted);font-size:0.85rem;">Offline or demo mode. Displaying local profiles below.</div>`;
    }
  },

  openInviteMemberModal(container) {
    let modal = document.getElementById('inviteMemberModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.id = 'inviteMemberModal';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog modal-md">
        <div class="modal-header">
          <div class="modal-title-group">
            <span class="brand-badge" style="background:#0284c7;color:#fff;">COMPANY SHARING</span>
            <h2 class="modal-title">Invite User to Business</h2>
          </div>
          <button class="modal-close-btn" id="closeInviteModalBtn">&times;</button>
        </div>
        <div class="modal-body" style="padding:1.25rem;">
          <div id="inviteAlertBox" style="display:none;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:0.75rem 1rem;border-radius:8px;font-size:0.85rem;margin-bottom:1rem;"></div>

          <form id="sendInviteForm">
            <div class="form-group">
              <label>Invitee Mobile Number or Email *</label>
              <input type="text" id="inviteeContact" class="form-control" placeholder="e.g. 9876543210 or user@example.com" required>
              <small style="color:#64748b;">The invited user will sign in with this mobile or email to access this company.</small>
            </div>
            <div class="form-group">
              <label>Full Name (Optional)</label>
              <input type="text" id="inviteeName" class="form-control" placeholder="e.g. Suresh Kumar (Accountant)">
            </div>
            <div class="form-group">
              <label>Select Role & Authorization Level *</label>
              <select id="inviteeRole" class="form-control" required>
                <option value="Admin">Admin (Full Operational Control & Invoicing)</option>
                <option value="Accountant" selected>Accountant (Ledgers, GST, Expenses, Reports)</option>
                <option value="Salesperson">Salesperson (Billing, Sales Orders, Customer Management)</option>
                <option value="Cashier">Cashier (Point of Sale Counter & Payments)</option>
                <option value="Read-Only User">Read-Only User (View Dashboard & Reports Only)</option>
              </select>
            </div>
            <div class="modal-footer" style="padding-left:0;padding-right:0;padding-bottom:0;margin-top:1.5rem;">
              <button type="button" class="btn btn-secondary" id="cancelInviteModalBtn">Cancel</button>
              <button type="submit" class="btn btn-primary" id="submitInviteBtn">Send Invitation</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modal.classList.add('active');
    const closeModal = () => modal.classList.remove('active');
    document.getElementById('closeInviteModalBtn').onclick = closeModal;
    document.getElementById('cancelInviteModalBtn').onclick = closeModal;

    document.getElementById('sendInviteForm').onsubmit = async (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('inviteAlertBox');
      const submitBtn = document.getElementById('submitInviteBtn');
      alertBox.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.innerText = 'Creating Invitation...';

      const contact = document.getElementById('inviteeContact').value.trim();
      const name = document.getElementById('inviteeName').value.trim();
      const role = document.getElementById('inviteeRole').value;

      const payload = {
        name,
        fullName: name,
        inviteeName: name,
        recipientName: name,
        role,
        notes: `Invited as ${role} for company access`
      };
      if (contact.includes('@')) {
        payload.email = contact;
        payload.recipientEmail = contact;
        payload.inviteeEmail = contact;
      } else {
        payload.phone = contact;
        payload.recipientPhone = contact;
        payload.inviteePhone = contact;
      }
      payload.contact = contact;

      try {
        const res = await window.Store.createBusinessInvitation(payload);
        submitBtn.disabled = false;
        submitBtn.innerText = 'Send Invitation';
        if (window.app && window.app.showToast) {
          window.app.showToast(`Invitation created for ${name || contact}! Token: ${res.invitation?.inviteToken}`, 'success');
        }
        closeModal();
        if (container) this.render(container);
      } catch (err) {
        alertBox.innerText = err.message || 'Failed to create invitation.';
        alertBox.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerText = 'Send Invitation';
      }
    };
  },

  switchUser(userId, container) {
    const user = window.Store.setCurrentUser(userId);
    if (user) {
      if (window.app && window.app.showToast) {
        window.app.showToast(`Switched active user to ${user.name} (${user.role})`, 'success');
      }
      this.updateTopbarUserDisplay();
      if (container) this.render(container);
    }
  },

  // Update Topbar User Badge & Avatar
  updateTopbarUserDisplay() {
    const user = window.Store.getCurrentUser() || { name: 'Admin', role: 'Admin', avatar: '👨‍💼' };
    const pill = document.getElementById('topbarUserPill');
    if (!pill) return;

    const avatar = user.avatar || ((user.role === 'Admin' || user.role === 'Owner') ? '👨‍💼' : '🧑‍💻');
    const name = user.name || 'Admin';
    const role = (user.role || 'Admin').toUpperCase();

    pill.innerHTML = `
      <span class="pill-icon" id="topbarUserAvatar" style="font-size:1.2rem;">${avatar}</span>
      <div class="pill-text-col" id="topbarUserTextCol">
        <span class="pill-title" id="topbarUserName" title="${name}">${name}</span>
        <span class="pill-subtitle" id="topbarUserRole">${role}</span>
      </div>
      <span class="pill-chevron">▼</span>
    `;
  },

  // Quick User Switch Modal
  openSwitchModal(container) {
    let modal = document.getElementById('switchUserModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.id = 'switchUserModal';
      document.body.appendChild(modal);
    }

    const users = window.Store.getUsers();
    const current = window.Store.getCurrentUser() || { name: 'Admin', role: 'Admin', avatar: '👨‍💼' };
    const activeBiz = window.Store.getBusiness() || { name: 'Active Business' };

    modal.innerHTML = `
      <div class="modal-dialog modal-md">
        <div class="modal-header">
          <div class="modal-title-group">
            <span class="brand-badge" style="background:#2563eb;color:#fff;">OPERATOR ACCOUNT</span>
            <h2 class="modal-title">${current.name} &bull; <span style="font-weight:600;color:var(--primary);">${current.role}</span></h2>
          </div>
          <button class="modal-close-btn" id="closeSwitchUserModalBtn">&times;</button>
        </div>
        <div class="modal-body">
          <!-- Active User Profile Banner -->
          <div style="background:linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%);border:1px solid #bae6fd;border-radius:var(--radius-md);padding:12px 14px;margin-bottom:1rem;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:2rem;line-height:1;">${current.avatar || '👨‍💼'}</span>
              <div>
                <div style="font-weight:700;font-size:14px;color:var(--navy-900);display:flex;align-items:center;gap:6px;">
                  <span id="modalActiveUserNameText">${current.name}</span>
                  <button type="button" id="quickEditAdminNameBtn" title="Edit Admin Name" style="background:none;border:none;cursor:pointer;font-size:12px;color:var(--primary);padding:0 4px;font-weight:700;">✏️ Edit Name</button>
                </div>
                <div style="font-size:11.5px;color:#475569;">
                  <span>🏢 ${activeBiz.name}</span> &bull; <span>${current.phone || current.email || 'Authorized Operator'}</span>
                </div>
              </div>
            </div>
            <span class="badge badge-success" style="font-size:11px;">CURRENTLY ACTIVE</span>
          </div>

          <div style="font-size:12.5px;font-weight:600;color:var(--navy-900);margin-bottom:0.5rem;display:flex;justify-content:space-between;align-items:center;">
            <span>Switch Counter Operator / Staff:</span>
            <span style="font-size:11px;color:var(--text-muted);font-weight:normal;">Select profile below</span>
          </div>

          <div style="display:flex;flex-direction:column;gap:0.6rem;max-height:260px;overflow-y:auto;padding-right:2px;">
            ${users.map(u => {
              const isActive = u.id === current.id || (u.email && u.email === current.email);
              const roleBadgeClass = (u.role === 'Admin' || u.role === 'Owner') ? 'badge-danger' : u.role === 'Accountant' ? 'badge-info' : 'badge-success';
              return `
                <div class="card select-switch-card" data-id="${u.id}" style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border:${isActive ? '2px solid var(--primary)' : '1px solid var(--border-subtle)'};background:${isActive ? '#eff6ff' : '#ffffff'};border-radius:var(--radius-md);transition:all 0.15s;">
                  <div style="display:flex;align-items:center;gap:0.75rem;">
                    <div style="font-size:1.6rem;line-height:1;">${u.avatar || '🧑‍💻'}</div>
                    <div>
                      <div style="font-weight:700;font-size:13.5px;color:var(--text-main);">${u.name}</div>
                      <div style="font-size:11px;color:var(--text-muted);">${u.title || (u.role + ' Operator')} &bull; ${u.phone || u.email || ''}</div>
                    </div>
                  </div>
                  <div>
                    ${isActive 
                      ? '<span class="badge badge-primary" style="font-size:10.5px;">Active ✓</span>' 
                      : `<button class="btn btn-sm btn-outline switch-user-action-btn" data-id="${u.id}" style="font-size:11px;padding:3px 10px;">Switch</button>`
                    }
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Bottom Actions: Manage Team, Switch Account, & Logout -->
          <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border-subtle);margin-top:1rem;padding-top:0.75rem;gap:0.5rem;flex-wrap:wrap;">
            <a href="#users" id="modalManageTeamLink" style="font-size:12px;color:var(--primary);font-weight:600;text-decoration:none;display:flex;align-items:center;gap:4px;">
              <span>👥 Manage Staff & Permissions &rarr;</span>
            </a>
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <button class="btn btn-sm btn-outline" id="modalSwitchAdminLoginBtn" style="font-size:11.5px;padding:4px 8px;display:flex;align-items:center;gap:4px;">
                <span>🔑 Switch Account / Login</span>
              </button>
              <button class="btn btn-sm btn-danger-outline" id="modalLogoutBtn" style="font-size:11.5px;padding:4px 8px;display:flex;align-items:center;gap:4px;">
                <span>🚪 Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');

    document.getElementById('closeSwitchUserModalBtn').onclick = () => modal.classList.remove('active');

    const quickEditBtn = document.getElementById('quickEditAdminNameBtn');
    if (quickEditBtn) {
      quickEditBtn.onclick = async () => {
        const newName = prompt("Enter your Admin Name (to be displayed across the app):", current.name);
        if (newName && newName.trim() && newName.trim() !== current.name) {
          await window.Store.updateAdminName(newName.trim());
          this.updateTopbarUserDisplay();
          if (window.app && window.app.showToast) {
            window.app.showToast(`Admin Name updated to ${newName.trim()}`, 'success');
          }
          this.openSwitchModal(container);
        }
      };
    }

    const switchAdminBtn = document.getElementById('modalSwitchAdminLoginBtn');
    if (switchAdminBtn) {
      switchAdminBtn.onclick = () => {
        modal.classList.remove('active');
        this.openAuthModal('login');
      };
    }

    const manageLink = document.getElementById('modalManageTeamLink');
    if (manageLink) {
      manageLink.onclick = () => {
        modal.classList.remove('active');
        window.location.hash = '#users';
      };
    }

    const logoutBtn = document.getElementById('modalLogoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        modal.classList.remove('active');
        if (window.Store && window.Store.logout) {
          await window.Store.logout();
        } else {
          localStorage.removeItem('lekhajokha_auth_token');
          localStorage.removeItem('lekhajokha_current_user');
          localStorage.removeItem('lekhajokha_active_business_id');
        }
        window.location.hash = '#home';
        if (window.app) {
          window.app.handleRoute();
          if (window.app.showToast) {
            window.app.showToast('You have been logged out successfully.', 'info');
          }
        }
      };
    }

    modal.querySelectorAll('.select-switch-card').forEach(card => {
      card.onclick = () => {
        const id = card.getAttribute('data-id');
        this.switchUser(id, container);
        modal.classList.remove('active');
      };
    });
  },

  // Modal to register a new user
  openAddUserModal(container) {
    let modal = document.getElementById('addUserModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.id = 'addUserModal';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog modal-md">
        <div class="modal-header">
          <div class="modal-title-group">
            <span class="brand-badge" style="background:#0284c7;color:#fff;">NEW STAFF</span>
            <h2 class="modal-title">Add Staff Member</h2>
          </div>
          <button class="modal-close-btn" id="closeAddUserModalBtn">&times;</button>
        </div>
        <div class="modal-body">
          <form id="addUserForm">
            <div class="form-group">
              <label>Full Name *</label>
              <input type="text" id="newUserName" class="form-control" placeholder="e.g. Rahul Sharma" required>
            </div>
            <div class="form-group">
              <label>Role / Position *</label>
              <select id="newUserRole" class="form-control" required>
                <option value="Biller">Biller (Counter Cashier & Billing)</option>
                <option value="Accountant">Accountant (Ledgers, GST, Expenses)</option>
                <option value="Sales">Sales Executive (Catalog & Quotes)</option>
                <option value="Admin">Admin (Full Control)</option>
              </select>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Phone Number</label>
                <input type="tel" id="newUserPhone" class="form-control" placeholder="9810123456">
              </div>
              <div class="form-group">
                <label>Quick PIN (4 Digits) *</label>
                <input type="text" id="newUserPin" class="form-control mono-val" maxlength="4" placeholder="1234" value="1234" required>
              </div>
            </div>
            <div class="modal-footer" style="padding-left:0;padding-right:0;padding-bottom:0;">
              <button type="button" class="btn btn-secondary" id="cancelAddUserBtn">Cancel</button>
              <button type="submit" class="btn btn-primary">Save User Profile</button>
            </div>
          </form>
        </div>
      </div>
    `;

    modal.classList.add('active');

    const closeModal = () => modal.classList.remove('active');
    document.getElementById('closeAddUserModalBtn').onclick = closeModal;
    document.getElementById('cancelAddUserBtn').onclick = closeModal;

    document.getElementById('addUserForm').onsubmit = async (e) => {
      e.preventDefault();
      const role = document.getElementById('newUserRole').value;
      const permissions = role === 'Admin' ? ['all'] :
        role === 'Accountant' ? ['view_reports', 'create_sale', 'create_purchase', 'manage_expenses', 'cash_bank', 'eway_bill'] :
        role === 'Biller' ? ['create_sale', 'view_items', 'view_parties', 'print_invoice', 'barcode_scan'] :
        ['create_sale', 'view_items', 'view_parties'];

      const userPayload = {
        name: document.getElementById('newUserName').value,
        role: role,
        title: role === 'Biller' ? 'Counter Cashier' : role === 'Accountant' ? 'Accounts Manager' : 'Staff',
        phone: document.getElementById('newUserPhone').value,
        pin: document.getElementById('newUserPin').value,
        permissions: permissions
      };

      window.Store.addUser(userPayload);

      // Persist centrally to authoritative backend
      try {
        await window.apiFetch('/api/v1/users', {
          method: 'POST',
          body: JSON.stringify(userPayload)
        });
      } catch (err) {
        console.warn('Central user creation deferred:', err);
      }

      closeModal();
      if (window.app && window.app.showToast) {
        window.app.showToast("New staff profile created successfully!", "success");
      }
      if (container) this.render(container);
    };
  },

  // User Menu & Session Manager
  openUserMenuModal(container) {
    let modal = document.getElementById('userMenuModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.id = 'userMenuModal';
      document.body.appendChild(modal);
    }

    const currentUser = window.Store.getCurrentUser();
    const activeBiz = window.Store.getActiveBusiness();

    modal.innerHTML = `
      <div class="modal-dialog modal-sm">
        <div class="modal-header">
          <div class="modal-title-group">
            <span class="brand-badge" style="background:#ed1a3b;color:#fff;">ACCOUNT & SECURITY</span>
            <h2 class="modal-title">${currentUser.name}</h2>
          </div>
          <button class="modal-close-btn" id="closeUserMenuModalBtn">&times;</button>
        </div>
        <div class="modal-body" style="padding:1rem;">
          <div style="background:var(--slate-50, #f8fafc);padding:0.75rem 1rem;border-radius:8px;margin-bottom:1rem;border:1px solid var(--border-subtle, #e2e8f0);">
            <div style="font-weight:700;color:var(--navy-900, #0f172a);">${activeBiz ? activeBiz.name : 'Business'}</div>
            <div style="font-size:0.8rem;color:#64748b;">Role: <strong style="color:#ed1a3b;">${currentUser.role}</strong> • ${currentUser.email || currentUser.phone || 'Active'}</div>
          </div>

          <div style="display:flex;flex-direction:column;gap:0.5rem;">
            <button class="btn btn-outline" id="menuManageSessionsBtn" style="justify-content:flex-start;text-align:left;">
              <span>📱 Active Devices & Sessions</span>
            </button>
            <button class="btn btn-outline" id="menuSwitchCashierBtn" style="justify-content:flex-start;text-align:left;">
              <span>👥 Switch Cashier / User</span>
            </button>
            <button class="btn btn-outline" id="menuSwitchAccountBtn" style="justify-content:flex-start;text-align:left;">
              <span>🔑 Sign In With Other Account</span>
            </button>
            <button class="btn btn-outline" id="menuRegisterBizBtn" style="justify-content:flex-start;text-align:left;">
              <span>🏢 Register New Business Account</span>
            </button>
            <div style="border-top:1px solid #e2e8f0;margin:0.5rem 0;"></div>
            <button class="btn btn-outline" id="menuLogoutDeviceBtn" style="color:#dc2626;border-color:#fca5a5;justify-content:flex-start;">
              <span>🚪 Log Out From This Device</span>
            </button>
            <button class="btn btn-danger" id="menuLogoutAllBtn" style="justify-content:flex-start;">
              <span>🔒 Log Out From All Devices</span>
            </button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
    const closeModal = () => modal.classList.remove('active');
    document.getElementById('closeUserMenuModalBtn').onclick = closeModal;

    document.getElementById('menuManageSessionsBtn').onclick = () => {
      closeModal();
      this.openSessionManagerModal();
    };

    document.getElementById('menuSwitchCashierBtn').onclick = () => {
      closeModal();
      this.openSwitchModal(container);
    };

    document.getElementById('menuSwitchAccountBtn').onclick = () => {
      closeModal();
      this.openAuthModal('login');
    };

    document.getElementById('menuRegisterBizBtn').onclick = () => {
      closeModal();
      this.openAuthModal('register');
    };

    document.getElementById('menuLogoutDeviceBtn').onclick = async () => {
      if (confirm("Are you sure you want to log out from this device?")) {
        closeModal();
        await window.Store.logout();
        window.location.hash = '#home';
        if (window.app) {
          window.app.handleRoute();
          if (window.app.showToast) {
            window.app.showToast("Logged out from this device.", "info");
          }
        }
      }
    };

    document.getElementById('menuLogoutAllBtn').onclick = async () => {
      if (confirm("Are you sure you want to log out from ALL devices? All active web, mobile and desktop sessions will be terminated immediately.")) {
        closeModal();
        await window.Store.logoutAll();
        window.location.hash = '#home';
        if (window.app) {
          window.app.handleRoute();
          if (window.app.showToast) {
            window.app.showToast("Logged out from all devices.", "warning");
          }
        }
      }
    };
  },

  // Active Sessions & Multi-Device Manager
  async openSessionManagerModal() {
    let modal = document.getElementById('sessionManagerModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.id = 'sessionManagerModal';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog modal-md">
        <div class="modal-header">
          <div class="modal-title-group">
            <span class="brand-badge" style="background:#0284c7;color:#fff;">MULTI-DEVICE SECURITY</span>
            <h2 class="modal-title">Active Devices & Sessions</h2>
          </div>
          <button class="modal-close-btn" id="closeSessionManagerModalBtn">&times;</button>
        </div>
        <div class="modal-body" style="padding:1.25rem;">
          <div id="sessionsLoadingIndicator" style="text-align:center;padding:1.5rem;color:#64748b;">
            Loading active sessions...
          </div>
          <div id="sessionsListContainer" style="display:none;flex-direction:column;gap:0.75rem;"></div>
          <div style="margin-top:1.5rem;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;padding-top:1rem;">
            <button class="btn btn-outline btn-sm" id="refreshSessionsBtn">🔄 Refresh List</button>
            <button class="btn btn-danger btn-sm" id="revokeAllSessionsBtn">Terminate All Remote Devices</button>
          </div>
        </div>
      </div>
    `;

    modal.classList.add('active');
    const closeModal = () => modal.classList.remove('active');
    document.getElementById('closeSessionManagerModalBtn').onclick = closeModal;

    const loadSessions = async () => {
      const loader = document.getElementById('sessionsLoadingIndicator');
      const listContainer = document.getElementById('sessionsListContainer');
      loader.style.display = 'block';
      listContainer.style.display = 'none';

      try {
        const data = await window.Store.getSessions();
        const sessions = data.sessions || [];
        const currentId = data.currentSessionId;

        loader.style.display = 'none';
        listContainer.style.display = 'flex';

        if (sessions.length === 0) {
          listContainer.innerHTML = '<div style="color:#64748b;text-align:center;padding:1rem;">No other sessions active.</div>';
          return;
        }

        listContainer.innerHTML = sessions.map(s => {
          const isCurrent = s.isCurrent || s.id === currentId;
          const platformIcon = (s.platform || '').toLowerCase().includes('android') ? '📱' :
            (s.platform || '').toLowerCase().includes('desktop') ? '💻' : '🌐';
          return `
            <div style="display:flex;justify-content:space-between;align-items:center;background:#fff;border:1px solid ${isCurrent ? '#0284c7' : '#e2e8f0'};padding:0.85rem 1rem;border-radius:8px;">
              <div style="display:flex;align-items:center;gap:0.85rem;">
                <span style="font-size:1.75rem;">${platformIcon}</span>
                <div>
                  <div style="font-weight:700;font-size:0.95rem;color:#0f172a;display:flex;align-items:center;gap:0.5rem;">
                    ${s.deviceName || s.platform || 'Device'}
                    ${isCurrent ? '<span class="badge badge-success" style="font-size:9px;">THIS DEVICE</span>' : ''}
                  </div>
                  <div style="font-size:0.75rem;color:#64748b;">
                    IP: ${s.ipAddress || '127.0.0.1'} • Last active: ${new Date(s.lastActiveAt || s.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div>
                ${isCurrent ? '' : `
                  <button class="btn btn-sm btn-outline revoke-session-btn" data-id="${s.id}" style="color:#dc2626;border-color:#fca5a5;">
                    Revoke
                  </button>
                `}
              </div>
            </div>
          `;
        }).join('');

        listContainer.querySelectorAll('.revoke-session-btn').forEach(btn => {
          btn.onclick = async () => {
            const sId = btn.getAttribute('data-id');
            if (confirm("Revoke this device's access? The device will be disconnected immediately.")) {
              await window.Store.revokeSession(sId);
              if (window.app && window.app.showToast) {
                window.app.showToast("Device session revoked.", "info");
              }
              loadSessions();
            }
          };
        });
      } catch (err) {
        loader.innerHTML = `<span style="color:#dc2626;">Failed to load sessions: ${err.message}</span>`;
      }
    };

    document.getElementById('refreshSessionsBtn').onclick = loadSessions;
    document.getElementById('revokeAllSessionsBtn').onclick = async () => {
      if (confirm("Log out all devices everywhere? All other active sessions will be terminated.")) {
        await window.Store.logoutAll();
        closeModal();
        window.location.hash = '#home';
        if (window.app) {
          window.app.handleRoute();
          if (window.app.showToast) {
            window.app.showToast("All devices logged out.", "warning");
          }
        }
      }
    };

    loadSessions();
  },

  // Central Unified Authentication & Registration Modal with Vyapar Mobile OTP Flow
  openAuthModal(defaultMode = 'otp') {
    let modal = document.getElementById('unifiedAuthModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.id = 'unifiedAuthModal';
      document.body.appendChild(modal);
    }

    let activeTab = (defaultMode === 'login' || defaultMode === 'register') ? 'password' : 'otp';
    let otpSent = false;
    let otpPhone = '';
    let adminNameProvided = '';
    let countdownTimer = null;
    let secondsLeft = 30;

    const render = () => {
      modal.innerHTML = `
        <div class="modal-dialog modal-md">
          <div class="modal-header">
            <div class="modal-title-group">
              <span class="brand-badge" style="background:#ed1a3b;color:#fff;">LEKHA JOKHA SAAS</span>
              <h2 class="modal-title">Sign In or Register Business</h2>
            </div>
            <button class="modal-close-btn" id="closeUnifiedAuthModalBtn">&times;</button>
          </div>
          <div class="modal-body" style="padding:1.25rem;">
            <!-- Dual Mode Tabs -->
            <div style="display:flex;border-bottom:2px solid #e2e8f0;margin-bottom:1.25rem;gap:0.5rem;">
              <button type="button" class="btn btn-sm ${activeTab === 'otp' ? 'btn-primary' : 'btn-outline'}" id="tabOtpBtn" style="border-bottom-left-radius:0;border-bottom-right-radius:0;font-weight:700;">
                📱 Mobile OTP (Instant & Secure)
              </button>
              <button type="button" class="btn btn-sm ${activeTab === 'password' ? 'btn-primary' : 'btn-outline'}" id="tabPasswordBtn" style="border-bottom-left-radius:0;border-bottom-right-radius:0;">
                🔑 Password / PIN
              </button>
            </div>

            <div id="authAlertBox" style="display:none;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:0.75rem 1rem;border-radius:8px;font-size:0.85rem;margin-bottom:1rem;"></div>
            <div id="authSuccessBox" style="display:none;background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;padding:0.75rem 1rem;border-radius:8px;font-size:0.85rem;margin-bottom:1rem;"></div>

            ${activeTab === 'otp' ? `
              <!-- Mobile OTP Flow -->
              <form id="mobileOtpForm">
                ${!otpSent ? `
                  <div style="margin-bottom:1rem;color:#64748b;font-size:0.85rem;line-height:1.4;">
                    Enter your Admin name and 10-digit mobile number. We'll send a 6-digit verification code.
                  </div>
                  <div class="form-group" style="margin-bottom:0.75rem;">
                    <label style="font-weight:700;font-size:0.85rem;">Admin / Owner Name *</label>
                    <input type="text" id="otpInitialName" class="form-control" placeholder="Enter Admin Name (e.g. Rohit Gupta)" value="${adminNameProvided}" style="font-size:0.95rem;font-weight:600;" required autofocus>
                  </div>
                  <div class="form-group">
                    <label style="font-weight:700;font-size:0.85rem;">Mobile Number *</label>
                    <div style="display:flex;align-items:center;border:1px solid var(--border-subtle, #cbd5e1);border-radius:6px;overflow:hidden;background:#fff;">
                      <div style="padding:0.6rem 0.75rem;background:#f8fafc;border-right:1px solid #cbd5e1;font-weight:700;color:#334155;font-size:0.95rem;display:flex;align-items:center;gap:4px;">
                        <span>🇮🇳 +91</span>
                      </div>
                      <input type="tel" id="otpPhoneInput" class="form-control" placeholder="e.g. 9876543210" maxlength="10" value="${otpPhone}" style="border:none;box-shadow:none;font-size:1.05rem;font-weight:600;letter-spacing:1px;" required>
                    </div>
                  </div>
                  <div style="margin-top:1.5rem;">
                    <button type="submit" class="btn btn-primary" id="sendOtpSubmitBtn" style="width:100%;padding:0.75rem;font-size:1rem;font-weight:700;">
                      Get 6-Digit Verification Code →
                    </button>
                  </div>
                ` : `
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:0.75rem 1rem;margin-bottom:1.25rem;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                      <div style="font-size:0.75rem;color:#64748b;text-transform:uppercase;font-weight:700;">Verification Code Sent To</div>
                      <div style="font-weight:800;color:#0f172a;font-size:1.05rem;">+91 ${otpPhone}</div>
                      ${adminNameProvided ? `<div style="font-size:0.8rem;color:#0369a1;margin-top:2px;">Logging in as: <strong>${adminNameProvided}</strong></div>` : ''}
                    </div>
                    <button type="button" class="btn btn-sm btn-link" id="changePhoneBtn" style="font-size:0.85rem;color:#0284c7;">Change</button>
                  </div>

                  <div class="form-group" style="text-align:center;">
                    <label style="font-size:0.9rem;font-weight:700;margin-bottom:0.5rem;display:block;">Enter 6-Digit OTP</label>
                    <input type="text" id="otpCodeInput" class="form-control mono-val" placeholder="• • • • • •" maxlength="6" style="letter-spacing:8px;font-size:1.5rem;font-weight:800;text-align:center;padding:0.6rem;max-width:240px;margin:0 auto;" required autofocus>
                  </div>

                  <div style="text-align:center;margin-top:0.75rem;margin-bottom:1.25rem;font-size:0.85rem;">
                    <span id="countdownText" style="color:#64748b;">Resend OTP in <strong id="secondsSpan">${secondsLeft}s</strong></span>
                    <button type="button" class="btn btn-link" id="resendOtpBtn" style="display:none;font-weight:700;color:#ed1a3b;padding:0;font-size:0.85rem;">Resend Code Now</button>
                  </div>

                  <!-- Profile confirmation -->
                  <div style="border-top:1px dashed #e2e8f0;padding-top:1rem;margin-bottom:1rem;">
                    <div style="font-size:0.8rem;font-weight:700;color:#64748b;margin-bottom:0.5rem;text-transform:uppercase;">Admin & Business Details</div>
                    <div class="form-grid-2">
                      <div class="form-group" style="margin-bottom:0.5rem;">
                        <input type="text" id="otpUserName" class="form-control" placeholder="Admin Name" value="${adminNameProvided}">
                      </div>
                      <div class="form-group" style="margin-bottom:0.5rem;">
                        <input type="text" id="otpBusinessName" class="form-control" placeholder="Firm / Shop Name (Optional)">
                      </div>
                    </div>
                  </div>

                  <div>
                    <button type="submit" class="btn btn-primary" id="verifyOtpSubmitBtn" style="width:100%;padding:0.75rem;font-size:1rem;font-weight:700;">
                      Verify & Open Business Dashboard ✓
                    </button>
                  </div>
                `}
              </form>
            ` : `
              <!-- Password / Quick PIN Form -->
              <form id="passwordAuthForm">
                <div class="form-group" style="margin-bottom:0.85rem;">
                  <label style="font-weight:700;font-size:0.85rem;">Admin / Owner Name *</label>
                  <input type="text" id="authAdminName" class="form-control" placeholder="Enter Admin Name (e.g. Rohit Gupta)" value="${adminNameProvided}" style="font-size:0.95rem;font-weight:600;" required autofocus>
                </div>
                <div class="form-group" style="margin-bottom:0.85rem;">
                  <label style="font-weight:700;font-size:0.85rem;">Email / Mobile Number / Username *</label>
                  <input type="text" id="authIdentifier" class="form-control" placeholder="Enter email or 10-digit mobile number" required>
                </div>
                <div class="form-group" style="margin-bottom:0.85rem;">
                  <label style="font-weight:700;font-size:0.85rem;">Password or Quick PIN *</label>
                  <input type="password" id="authPassword" class="form-control" placeholder="Enter password or 4-digit PIN" required>
                </div>
                <div style="margin-top:1.5rem;display:flex;justify-content:space-between;align-items:center;">
                  <button type="button" class="btn btn-link" id="switchToOtpBtn" style="padding:0;font-size:0.85rem;color:#0284c7;">
                    Sign in with Mobile OTP instead
                  </button>
                  <button type="submit" class="btn btn-primary" id="submitPassAuthBtn">
                    Sign In
                  </button>
                </div>
              </form>
            `}
          </div>
        </div>
      `;

      // Event handlers
      document.getElementById('closeUnifiedAuthModalBtn').onclick = () => {
        if (countdownTimer) clearInterval(countdownTimer);
        modal.classList.remove('active');
      };

      document.getElementById('tabOtpBtn').onclick = () => {
        activeTab = 'otp';
        render();
      };

      document.getElementById('tabPasswordBtn').onclick = () => {
        activeTab = 'password';
        render();
      };

      const alertBox = document.getElementById('authAlertBox');
      const successBox = document.getElementById('authSuccessBox');

      if (activeTab === 'otp') {
        const otpForm = document.getElementById('mobileOtpForm');
        if (!otpSent) {
          otpForm.onsubmit = async (e) => {
            e.preventDefault();
            alertBox.style.display = 'none';
            successBox.style.display = 'none';

            const nameInput = document.getElementById('otpInitialName')?.value.trim();
            if (!nameInput) {
              alertBox.innerText = 'Please enter your Admin / Owner Name.';
              alertBox.style.display = 'block';
              return;
            }
            adminNameProvided = nameInput;

            const phone = document.getElementById('otpPhoneInput').value.trim();
            if (!/^[6-9]\d{9}$/.test(phone)) {
              alertBox.innerText = 'Please enter a valid 10-digit Indian mobile number.';
              alertBox.style.display = 'block';
              return;
            }
            const submitBtn = document.getElementById('sendOtpSubmitBtn');
            submitBtn.disabled = true;
            submitBtn.innerText = 'Sending OTP...';

            try {
              const res = await window.Store.sendOtp(phone, 'login');
              otpPhone = phone;
              otpSent = true;
              secondsLeft = res.cooldownSeconds || 30;
              render();
              startTimer();
              if (res.testOtp) {
                const alertEl = document.getElementById('authSuccessBox');
                if (alertEl) {
                  alertEl.innerText = `Verification code sent to ${phone}. (Dev code: ${res.testOtp})`;
                  alertEl.style.display = 'block';
                }
              }
            } catch (err) {
              alertBox.innerText = err.message || 'Failed to send OTP.';
              alertBox.style.display = 'block';
              submitBtn.disabled = false;
              submitBtn.innerText = 'Get 6-Digit Verification Code →';
            }
          };
        } else {
          // Verify form
          document.getElementById('changePhoneBtn').onclick = () => {
            if (countdownTimer) clearInterval(countdownTimer);
            otpSent = false;
            render();
          };

          const resendBtn = document.getElementById('resendOtpBtn');
          if (resendBtn) {
            resendBtn.onclick = async () => {
              try {
                resendBtn.disabled = true;
                const res = await window.Store.sendOtp(otpPhone, 'login');
                secondsLeft = res.cooldownSeconds || 30;
                startTimer();
                if (res.testOtp) {
                  const sBox = document.getElementById('authSuccessBox');
                  if (sBox) {
                    sBox.innerText = `New code sent! (Dev code: ${res.testOtp})`;
                    sBox.style.display = 'block';
                  }
                }
              } catch (err) {
                alertBox.innerText = err.message || 'Failed to resend OTP.';
                alertBox.style.display = 'block';
              }
            };
          }

          otpForm.onsubmit = async (e) => {
            e.preventDefault();
            alertBox.style.display = 'none';
            const otpCode = document.getElementById('otpCodeInput').value.trim();
            if (otpCode.length !== 6) {
              alertBox.innerText = 'Please enter the complete 6-digit OTP.';
              alertBox.style.display = 'block';
              return;
            }
            const verifyBtn = document.getElementById('verifyOtpSubmitBtn');
            verifyBtn.disabled = true;
            verifyBtn.innerText = 'Verifying & Initializing...';

            const userName = document.getElementById('otpUserName')?.value.trim() || adminNameProvided;
            const businessName = document.getElementById('otpBusinessName')?.value.trim();

            try {
              if (countdownTimer) clearInterval(countdownTimer);
              const data = await window.Store.verifyOtp(otpPhone, otpCode, {
                name: userName || undefined,
                adminName: userName || undefined,
                businessName: businessName || undefined
              });

              this.updateTopbarUserDisplay();

              modal.classList.remove('active');
              if (window.app) {
                if (window.app.showToast) {
                  window.app.showToast(`Welcome! Verified as ${data.user?.name || data.user?.phone}`, 'success');
                }
                if (window.app.updateBadges) window.app.updateBadges();
                if (window.app.handleRoute) window.app.handleRoute();
              }
            } catch (err) {
              alertBox.innerText = err.message || 'Invalid or expired OTP. Please try again.';
              alertBox.style.display = 'block';
              verifyBtn.disabled = false;
              verifyBtn.innerText = 'Verify & Open Business Dashboard ✓';
            }
          };
        }
      } else {
        // Password form
        const switchOtpBtn = document.getElementById('switchToOtpBtn');
        if (switchOtpBtn) {
          switchOtpBtn.onclick = () => {
            activeTab = 'otp';
            render();
          };
        }

        const passForm = document.getElementById('passwordAuthForm');
        passForm.onsubmit = async (e) => {
          e.preventDefault();
          alertBox.style.display = 'none';
          const submitBtn = document.getElementById('submitPassAuthBtn');
          submitBtn.disabled = true;
          submitBtn.innerText = 'Signing in...';

          try {
            const adminName = document.getElementById('authAdminName')?.value.trim();
            const identifier = document.getElementById('authIdentifier').value.trim();
            const password = document.getElementById('authPassword').value;

            if (!adminName) {
              alertBox.innerText = 'Please enter your Admin Name.';
              alertBox.style.display = 'block';
              submitBtn.disabled = false;
              submitBtn.innerText = 'Sign In';
              return;
            }

            const data = await window.Store.login({
              identifier,
              password,
              name: adminName,
              adminName: adminName
            });

            this.updateTopbarUserDisplay();

            modal.classList.remove('active');
            if (window.app) {
              if (window.app.showToast) {
                window.app.showToast(`Signed in successfully as ${data.user?.name || adminName}!`, 'success');
              }
              if (window.app.updateBadges) window.app.updateBadges();
              if (window.app.handleRoute) window.app.handleRoute();
            }
          } catch (err) {
            alertBox.innerText = err.message || 'Authentication failed. Please check your credentials.';
            alertBox.style.display = 'block';
          } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Sign In';
          }
        };
      }
    };

    const startTimer = () => {
      if (countdownTimer) clearInterval(countdownTimer);
      const countdownText = document.getElementById('countdownText');
      const secondsSpan = document.getElementById('secondsSpan');
      const resendBtn = document.getElementById('resendOtpBtn');
      if (countdownText) countdownText.style.display = 'inline';
      if (resendBtn) resendBtn.style.display = 'none';

      countdownTimer = setInterval(() => {
        secondsLeft--;
        if (secondsSpan) secondsSpan.innerText = `${secondsLeft}s`;
        if (secondsLeft <= 0) {
          clearInterval(countdownTimer);
          if (countdownText) countdownText.style.display = 'none';
          if (resendBtn) {
            resendBtn.style.display = 'inline';
            resendBtn.disabled = false;
          }
        }
      }, 1000);
    };

    render();
    modal.classList.add('active');
  }
};

